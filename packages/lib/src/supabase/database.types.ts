/**
 * Hand-maintained mirror of supabase/migrations/*.sql. Keep in sync with
 * the schema whenever a migration changes table shape.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          career_goals: string[];
          current_job_title: string | null;
          preferred_locations: string[];
          work_types: string[];
          priorities: string[];
          journey_theme: string;
          onboarding_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      jobs: {
        Row: {
          id: string;
          title: string;
          company: string;
          location: string | null;
          is_remote: boolean;
          employment_type: string;
          seniority_level: string | null;
          salary_min: number | null;
          salary_max: number | null;
          description: string;
          skills: string[];
          apply_url: string | null;
          posted_at: string;
          created_at: string;
          source: string;
          source_id: string | null;
          is_active: boolean;
          expires_at: string | null;
          last_seen_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["jobs"]["Row"]>;
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          status: string;
          match_score: number | null;
          match_reason: string | null;
          applied_at: string | null;
          notes: string | null;
          resume_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["applications"]["Row"]> & {
          user_id: string;
          job_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["applications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      journey_milestones: {
        Row: {
          id: string;
          application_id: string;
          type: string;
          occurred_at: string;
          metadata: Record<string, unknown> | null;
        };
        Insert: Partial<Database["public"]["Tables"]["journey_milestones"]["Row"]> & {
          application_id: string;
          type: string;
        };
        Update: Partial<Database["public"]["Tables"]["journey_milestones"]["Row"]>;
        Relationships: [];
      };
      interviews: {
        Row: {
          id: string;
          application_id: string;
          user_id: string;
          interview_type: string;
          status: string;
          scheduled_at: string;
          location_or_link: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["interviews"]["Row"]> & {
          application_id: string;
          user_id: string;
          scheduled_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["interviews"]["Row"]>;
        Relationships: [];
      };
      ai_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          context: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_conversations"]["Row"]> & {
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_conversations"]["Row"]>;
        Relationships: [];
      };
      ai_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]> & {
          conversation_id: string;
          role: string;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_messages"]["Row"]>;
        Relationships: [];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          is_primary: boolean;
          template: string;
          content: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["resumes"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["resumes"]["Row"]>;
        Relationships: [];
      };
      cover_letters: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          title: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cover_letters"]["Row"]> & { user_id: string };
        Update: Partial<Database["public"]["Tables"]["cover_letters"]["Row"]>;
        Relationships: [];
      };
      learning_resources: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          resource_type: string;
          skill_tags: string[];
          url: string | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["learning_resources"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["learning_resources"]["Row"]>;
        Relationships: [];
      };
      learning_progress: {
        Row: {
          id: string;
          user_id: string;
          resource_id: string;
          status: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["learning_progress"]["Row"]> & {
          user_id: string;
          resource_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["learning_progress"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          read_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          user_id: string;
          type: string;
          title: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      user_integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          status: string;
          connected_at: string | null;
          metadata: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["user_integrations"]["Row"]> & {
          user_id: string;
          provider: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_integrations"]["Row"]>;
        Relationships: [];
      };
      dismissed_jobs: {
        Row: {
          id: string;
          user_id: string;
          job_id: string;
          dismissed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["dismissed_jobs"]["Row"]> & {
          user_id: string;
          job_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["dismissed_jobs"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "dismissed_jobs_job_id_fkey";
            columns: ["job_id"];
            isOneToOne: false;
            referencedRelation: "jobs";
            referencedColumns: ["id"];
          },
        ];
      };
      job_ingestion_runs: {
        Row: {
          id: string;
          source: string;
          status: string;
          jobs_found: number;
          jobs_created: number;
          jobs_updated: number;
          jobs_archived: number;
          jobs_duplicates_removed: number;
          error: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["job_ingestion_runs"]["Row"]> & { source: string };
        Update: Partial<Database["public"]["Tables"]["job_ingestion_runs"]["Row"]>;
        Relationships: [];
      };
      recruiter_emails: {
        Row: {
          id: string;
          user_id: string;
          application_id: string | null;
          source: string;
          gmail_message_id: string | null;
          from_name: string | null;
          from_email: string;
          subject: string;
          body: string;
          category: string;
          received_at: string;
          read_at: string | null;
          draft_reply: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["recruiter_emails"]["Row"]> & {
          user_id: string;
          from_email: string;
          subject: string;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["recruiter_emails"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "recruiter_emails_application_id_fkey";
            columns: ["application_id"];
            isOneToOne: false;
            referencedRelation: "applications";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
