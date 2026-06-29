// ── SIR AI — Database row types ──
// Each interface matches a Supabase table schema.

export interface RoadmapRow {
  id: string;
  user_id: string;
  topic: string;
  level: string;
  goal: string;
  roadmap_content: string;
  current_task_index: number;
  created_at: string;
}

export interface TaskChatRow {
  roadmap_id: string;
  task_index: number;
  messages: { role: "user" | "ai"; content: string }[];
  retry_count: number;
  last_error: string | null;
  is_stuck: boolean;
}

export interface ProjectProgressRow {
  id: string;
  user_id: string;
  user_name: string | null;
  roadmap_id: string;
  task_index: number;
  task_text: string;
  proof_url: string | null;
  submission_type: string;
  submission_data: Record<string, unknown> | null;
  completed_at: string;
  verified_status: boolean | null;
  verified_feedback: string | null;
  verified_timestamp: string | null;
}

// ── Supabase Database type (all tables) — useful for generated type helpers ──
export interface Database {
  public: {
    Tables: {
      roadmaps: {
        Row: RoadmapRow;
        Insert: Omit<RoadmapRow, "id" | "created_at">;
        Update: Partial<Omit<RoadmapRow, "id">>;
      };
      task_chats: {
        Row: TaskChatRow;
        Insert: TaskChatRow;
        Update: Partial<TaskChatRow>;
      };
      project_progress: {
        Row: ProjectProgressRow;
        Insert: Omit<ProjectProgressRow, "id">;
        Update: Partial<Omit<ProjectProgressRow, "id">>;
      };
    };
  };
}