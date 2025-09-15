@@ .. @@
 CREATE TABLE IF NOT EXISTS enhanced_rooms (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   name text NOT NULL,
   description text,
   room_type text NOT NULL CHECK (room_type IN ('cinema', 'mansion')),
-  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
+  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
   max_participants integer DEFAULT 50,
   is_public boolean DEFAULT true,
   is_active boolean DEFAULT true,
@@ .. @@
   updated_at timestamptz DEFAULT now()
 );
 
+-- Add PostgREST foreign key hint for host_id relationship
+COMMENT ON COLUMN enhanced_rooms.host_id IS 'Foreign key to users view';
+
 -- Create enhanced_room_participants table