import { useState, useEffect } from 'react';
import { honeypotService, AttackEvent, HoneypotService } from '../services/honeypotService';

export const useHoneypotData = () => {
  const [attacks, setAttacks] = useState<AttackEvent[]>([]);
  const [services, setServices] = useState<HoneypotService[]>([]);
  const [stats, setStats] = useState({
    totalAttacks: 0,
    activeConnections: 0,
    blockedIPs: 0,
    servicesRunning: 0
  });

  useEffect(() => {
    // Initialize honeypot services
    honeypotService.initializeServices();
    
    // Set initial data
    setServices(honeypotService.getServices());
    setAttacks(honeypotService.getRecentAttacks());

    // Simulate real-time attack detection
    const attackInterval = setInterval(() => {
      const newAttack = honeypotService.generateAttackEvent();
      honeypotService.addAttack(newAttack);
      
      setAttacks(prev => [newAttack, ...prev.slice(0, 49)]); // Keep last 50 attacks
      setServices(honeypotService.getServices());
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalAttacks: prev.totalAttacks + 1,
        activeConnections: Math.floor(Math.random() * 50) + 10,
        blockedIPs: Math.floor(Math.random() * 200) + 50
      }));
    }, Math.random() * 10000 + 5000); // Random interval between 5-15 seconds

    // Update service connections periodically
    const serviceInterval = setInterval(() => {
      setServices(prev => prev.map(service => ({
        ...service,
        connections: Math.max(0, service.connections + Math.floor(Math.random() * 6) - 3)
      })));
    }, 3000);

    return () => {
      clearInterval(attackInterval);
      clearInterval(serviceInterval);
    };
  }, []);

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      servicesRunning: services.filter(s => s.status === 'active').length
    }));
  }, [services]);

  return {
    attacks,
    services,
    stats
  };
};