# WebRTC Implementation Guide

## Architecture Overview

### Signaling Server Architecture

```typescript
// signaling-server/src/types/room.ts
export interface Room {
  id: string;
  type: 'cinema' | 'mansion' | 'private';
  participants: Map<string, Participant>;
  maxParticipants: number;
  isPublic: boolean;
  metadata: RoomMetadata;
}

export interface Participant {
  id: string;
  socketId: string;
  userId: string;
  role: 'host' | 'participant' | 'viewer';
  mediaState: MediaState;
  joinedAt: Date;
}

export interface MediaState {
  video: boolean;
  audio: boolean;
  screenShare: boolean;
  quality: 'low' | 'medium' | 'high' | '4k';
}
```

### Signaling Server Implementation

```typescript
// signaling-server/src/server.ts
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { RoomManager } from './managers/RoomManager';
import { MediasoupManager } from './managers/MediasoupManager';

export class SignalingServer {
  private io: Server;
  private roomManager: RoomManager;
  private mediasoupManager: MediasoupManager;

  constructor() {
    this.io = new Server({
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupRedisAdapter();
    this.roomManager = new RoomManager();
    this.mediasoupManager = new MediasoupManager();
    this.setupEventHandlers();
  }

  private setupRedisAdapter() {
    const redisAdapter = createAdapter({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
    this.io.adapter(redisAdapter);
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('join-room', async (data) => {
        await this.handleJoinRoom(socket, data);
      });

      socket.on('leave-room', async (data) => {
        await this.handleLeaveRoom(socket, data);
      });

      socket.on('webrtc-offer', async (data) => {
        await this.handleWebRTCOffer(socket, data);
      });

      socket.on('webrtc-answer', async (data) => {
        await this.handleWebRTCAnswer(socket, data);
      });

      socket.on('ice-candidate', async (data) => {
        await this.handleICECandidate(socket, data);
      });

      socket.on('start-screen-share', async (data) => {
        await this.handleStartScreenShare(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleJoinRoom(socket: Socket, data: any) {
    const { roomId, userId, mediaState } = data;
    
    try {
      const room = await this.roomManager.joinRoom(roomId, {
        id: userId,
        socketId: socket.id,
        userId,
        role: 'participant',
        mediaState,
        joinedAt: new Date()
      });

      socket.join(roomId);
      
      // Notify other participants
      socket.to(roomId).emit('user-joined', {
        userId,
        mediaState
      });

      // Send current room state to joining user
      socket.emit('room-state', {
        participants: Array.from(room.participants.values()),
        metadata: room.metadata
      });

      // Initialize mediasoup transport if needed
      if (room.type === 'cinema' && room.participants.size > 2) {
        const transport = await this.mediasoupManager.createTransport(userId, roomId);
        socket.emit('transport-created', transport);
      }

    } catch (error) {
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  private async handleWebRTCOffer(socket: Socket, data: any) {
    const { roomId, targetUserId, offer } = data;
    
    // For P2P connections (small groups)
    if (await this.shouldUseP2P(roomId)) {
      socket.to(roomId).emit('webrtc-offer', {
        fromUserId: socket.data.userId,
        offer
      });
    } else {
      // Route through SFU
      await this.mediasoupManager.handleOffer(socket.data.userId, roomId, offer);
    }
  }

  private async shouldUseP2P(roomId: string): Promise<boolean> {
    const room = this.roomManager.getRoom(roomId);
    return room ? room.participants.size <= 3 : true;
  }
}
```

### MediaSoup SFU Integration

```typescript
// signaling-server/src/managers/MediasoupManager.ts
import { Worker, Router, Transport, Producer, Consumer } from 'mediasoup/node/lib/types';
import * as mediasoup from 'mediasoup';

export class MediasoupManager {
  private workers: Worker[] = [];
  private routers: Map<string, Router> = new Map();
  private transports: Map<string, Transport> = new Map();
  private producers: Map<string, Producer> = new Map();
  private consumers: Map<string, Consumer> = new Map();

  async initialize() {
    // Create mediasoup workers (one per CPU core)
    const numWorkers = require('os').cpus().length;
    
    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        rtcMinPort: 10000,
        rtcMaxPort: 10100,
      });

      worker.on('died', () => {
        console.error('MediaSoup worker died, exiting');
        process.exit(1);
      });

      this.workers.push(worker);
    }
  }

  async createRouter(roomId: string): Promise<Router> {
    // Load balance across workers
    const worker = this.workers[Math.floor(Math.random() * this.workers.length)];
    
    const router = await worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/VP9',
          clockRate: 90000,
          parameters: {
            'profile-id': 2,
          },
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '4d0032',
            'level-asymmetry-allowed': 1,
          },
        },
      ],
    });

    this.routers.set(roomId, router);
    return router;
  }

  async createTransport(userId: string, roomId: string) {
    const router = this.routers.get(roomId);
    if (!router) throw new Error('Router not found');

    const transport = await router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || undefined,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      // DTLS parameters
      enableSctp: true,
      numSctpStreams: { OS: 1024, MIS: 1024 },
      maxIncomingBitrate: 1500000,
    });

    this.transports.set(`${userId}-${roomId}`, transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sctpParameters: transport.sctpParameters,
    };
  }

  async produceMedia(userId: string, roomId: string, rtpParameters: any, kind: 'audio' | 'video') {
    const transport = this.transports.get(`${userId}-${roomId}`);
    if (!transport) throw new Error('Transport not found');

    const producer = await transport.produce({
      kind,
      rtpParameters,
      // Enable simulcast for video
      ...(kind === 'video' && {
        encodings: [
          { maxBitrate: 100000, scaleResolutionDownBy: 4 },
          { maxBitrate: 300000, scaleResolutionDownBy: 2 },
          { maxBitrate: 900000, scaleResolutionDownBy: 1 },
        ],
      }),
    });

    this.producers.set(`${userId}-${roomId}-${kind}`, producer);
    return { id: producer.id };
  }

  async consumeMedia(consumerUserId: string, producerUserId: string, roomId: string, rtpCapabilities: any) {
    const router = this.routers.get(roomId);
    const transport = this.transports.get(`${consumerUserId}-${roomId}`);
    
    if (!router || !transport) throw new Error('Router or transport not found');

    const consumers = [];
    
    // Consume audio and video from producer
    for (const kind of ['audio', 'video']) {
      const producer = this.producers.get(`${producerUserId}-${roomId}-${kind}`);
      
      if (producer && router.canConsume({ producerId: producer.id, rtpCapabilities })) {
        const consumer = await transport.consume({
          producerId: producer.id,
          rtpCapabilities,
          paused: false,
        });

        this.consumers.set(`${consumerUserId}-${producerUserId}-${roomId}-${kind}`, consumer);
        consumers.push({
          id: consumer.id,
          producerId: producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        });
      }
    }

    return consumers;
  }
}
```

### Client-Side WebRTC Implementation

```typescript
// client/src/services/WebRTCService.ts
export class WebRTCService {
  private localStream?: MediaStream;
  private screenStream?: MediaStream;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private socket: Socket;
  private isScreenSharing = false;

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  async initializeMedia(constraints: MediaStreamConstraints = {
    video: { width: 1920, height: 1080, frameRate: 60 },
    audio: { echoCancellation: true, noiseSuppression: true }
  }): Promise<MediaStream> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize media:', error);
      throw error;
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 3840 },
          height: { ideal: 1080, max: 2160 },
          frameRate: { ideal: 60, max: 60 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      this.isScreenSharing = true;
      
      // Handle screen share ended
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      // Replace video track in all peer connections
      for (const [userId, pc] of this.peerConnections) {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && this.screenStream) {
          await sender.replaceTrack(this.screenStream.getVideoTracks()[0]);
        }
      }

      this.socket.emit('start-screen-share');
      return this.screenStream;

    } catch (error) {
      console.error('Failed to start screen share:', error);
      throw error;
    }
  }

  async stopScreenShare() {
    if (!this.isScreenSharing || !this.screenStream) return;

    this.screenStream.getTracks().forEach(track => track.stop());
    this.isScreenSharing = false;

    // Switch back to camera if available
    if (this.localStream) {
      for (const [userId, pc] of this.peerConnections) {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && this.localStream) {
          await sender.replaceTrack(this.localStream.getVideoTracks()[0]);
        }
      }
    }

    this.socket.emit('stop-screen-share');
  }

  async createPeerConnection(userId: string): Promise<RTCPeerConnection> {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        {
          urls: 'turn:turn.example.com:3478',
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD
        }
      ],
      iceCandidatePoolSize: 10,
    };

    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks
    const stream = this.isScreenSharing ? this.screenStream : this.localStream;
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          targetUserId: userId,
          candidate: event.candidate
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      this.onRemoteStream?.(userId, remoteStream);
    };

    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${userId}:`, pc.connectionState);
      if (pc.connectionState === 'failed') {
        this.handleConnectionFailure(userId);
      }
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  private async handleConnectionFailure(userId: string) {
    console.log(`Connection failed with ${userId}, attempting ICE restart`);
    const pc = this.peerConnections.get(userId);
    if (pc) {
      // Attempt ICE restart
      const offer = await pc.createOffer({ iceRestart: true });
      await pc.setLocalDescription(offer);
      
      this.socket.emit('webrtc-offer', {
        targetUserId: userId,
        offer
      });
    }
  }

  private setupSocketListeners() {
    this.socket.on('webrtc-offer', async (data) => {
      const { fromUserId, offer } = data;
      const pc = await this.createPeerConnection(fromUserId);
      
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      this.socket.emit('webrtc-answer', {
        targetUserId: fromUserId,
        answer
      });
    });

    this.socket.on('webrtc-answer', async (data) => {
      const { fromUserId, answer } = data;
      const pc = this.peerConnections.get(fromUserId);
      
      if (pc) {
        await pc.setRemoteDescription(answer);
      }
    });

    this.socket.on('ice-candidate', async (data) => {
      const { fromUserId, candidate } = data;
      const pc = this.peerConnections.get(fromUserId);
      
      if (pc) {
        await pc.addIceCandidate(candidate);
      }
    });
  }

  // Public event handlers
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
}
```

### Performance Optimization

```typescript
// client/src/services/AdaptiveBitrateService.ts
export class AdaptiveBitrateService {
  private currentBitrate = 1000000; // Start at 1Mbps
  private targetLatency = 300; // 300ms target
  private lastLatencies: number[] = [];

  async optimizeBitrate(peerConnection: RTCPeerConnection) {
    const stats = await peerConnection.getStats();
    let latency = 0;
    let packetLoss = 0;

    stats.forEach((report) => {
      if (report.type === 'inbound-rtp' && report.kind === 'video') {
        latency = report.jitter * 1000; // Convert to ms
        packetLoss = (report.packetsLost / report.packetsReceived) * 100;
      }
    });

    this.lastLatencies.push(latency);
    if (this.lastLatencies.length > 5) {
      this.lastLatencies.shift();
    }

    const avgLatency = this.lastLatencies.reduce((a, b) => a + b, 0) / this.lastLatencies.length;

    // Adjust bitrate based on network conditions
    if (avgLatency > this.targetLatency * 1.5 || packetLoss > 2) {
      // Network struggling, reduce quality
      this.currentBitrate = Math.max(this.currentBitrate * 0.8, 200000);
    } else if (avgLatency < this.targetLatency * 0.7 && packetLoss < 0.5) {
      // Network stable, can increase quality
      this.currentBitrate = Math.min(this.currentBitrate * 1.2, 3000000);
    }

    await this.applyBitrateLimit(peerConnection);
  }

  private async applyBitrateLimit(peerConnection: RTCPeerConnection) {
    const senders = peerConnection.getSenders();
    
    for (const sender of senders) {
      if (sender.track && sender.track.kind === 'video') {
        const params = sender.getParameters();
        
        if (params.encodings && params.encodings.length > 0) {
          params.encodings[0].maxBitrate = this.currentBitrate;
          await sender.setParameters(params);
        }
      }
    }
  }
}
```