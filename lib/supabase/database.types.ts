export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_entities: {
        Row: {
          cage_code: string | null
          city: string | null
          created_at: string | null
          employee_count: number | null
          focus_area: string | null
          founding_date: string | null
          geographic_ties: Json | null
          id: string
          industry: string | null
          is_african_american_owned: boolean | null
          is_community_serving: boolean | null
          is_minority_owned: boolean | null
          is_social_enterprise: boolean | null
          is_tech_company: boolean | null
          is_underserved_community_tied: boolean | null
          mission: string | null
          mission_embedding: string | null
          naics_codes: string[] | null
          name: string
          owner_demographics: Json | null
          parent_id: string | null
          pitch_angles_generated: Json | null
          revenue_range: string | null
          sam_registered: boolean | null
          sam_uei: string | null
          sbir_eligible: boolean | null
          sbir_phases: string[] | null
          state: string | null
          type: string
          updated_at: string | null
          uploaded_documents: string[] | null
          who_we_serve: string[] | null
          zip_codes_served: string[] | null
        }
        Insert: {
          cage_code?: string | null
          city?: string | null
          created_at?: string | null
          employee_count?: number | null
          focus_area?: string | null
          founding_date?: string | null
          geographic_ties?: Json | null
          id?: string
          industry?: string | null
          is_african_american_owned?: boolean | null
          is_community_serving?: boolean | null
          is_minority_owned?: boolean | null
          is_social_enterprise?: boolean | null
          is_tech_company?: boolean | null
          is_underserved_community_tied?: boolean | null
          mission?: string | null
          mission_embedding?: string | null
          naics_codes?: string[] | null
          name: string
          owner_demographics?: Json | null
          parent_id?: string | null
          pitch_angles_generated?: Json | null
          revenue_range?: string | null
          sam_registered?: boolean | null
          sam_uei?: string | null
          sbir_eligible?: boolean | null
          sbir_phases?: string[] | null
          state?: string | null
          type: string
          updated_at?: string | null
          uploaded_documents?: string[] | null
          who_we_serve?: string[] | null
          zip_codes_served?: string[] | null
        }
        Update: {
          cage_code?: string | null
          city?: string | null
          created_at?: string | null
          employee_count?: number | null
          focus_area?: string | null
          founding_date?: string | null
          geographic_ties?: Json | null
          id?: string
          industry?: string | null
          is_african_american_owned?: boolean | null
          is_community_serving?: boolean | null
          is_minority_owned?: boolean | null
          is_social_enterprise?: boolean | null
          is_tech_company?: boolean | null
          is_underserved_community_tied?: boolean | null
          mission?: string | null
          mission_embedding?: string | null
          naics_codes?: string[] | null
          name?: string
          owner_demographics?: Json | null
          parent_id?: string | null
          pitch_angles_generated?: Json | null
          revenue_range?: string | null
          sam_registered?: boolean | null
          sam_uei?: string | null
          sbir_eligible?: boolean | null
          sbir_phases?: string[] | null
          state?: string | null
          type?: string
          updated_at?: string | null
          uploaded_documents?: string[] | null
          who_we_serve?: string[] | null
          zip_codes_served?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "business_entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_profile: {
        Row: {
          created_at: string | null
          id: string
          key_milestones: Json | null
          origin_story: string | null
          owner_name: string
          personal_community_ties: string | null
          press_recognition: Json | null
          updated_at: string | null
          why_i_started: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_milestones?: Json | null
          origin_story?: string | null
          owner_name: string
          personal_community_ties?: string | null
          press_recognition?: Json | null
          updated_at?: string | null
          why_i_started?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key_milestones?: Json | null
          origin_story?: string | null
          owner_name?: string
          personal_community_ties?: string | null
          press_recognition?: Json | null
          updated_at?: string | null
          why_i_started?: Json | null
        }
        Relationships: []
      }
      grant_applications: {
        Row: {
          content_embedding: string | null
          created_at: string | null
          deadline: string | null
          draft_content: Json | null
          draft_docx_url: string | null
          draft_pdf_url: string | null
          entity_id: string | null
          feedback_requested_at: string | null
          grant_id: string | null
          grant_match_id: string | null
          humanizer_applied: boolean | null
          id: string
          loi_submission_id: string | null
          outcome: Database["public"]["Enums"]["outcome_status"] | null
          outcome_amount: number | null
          qa_passed: boolean | null
          qa_retry_count: number | null
          qa_scores: Json | null
          rejection_reason: string | null
          research_notes: Json | null
          selected_angles: string[] | null
          selected_framework: string | null
          status: Database["public"]["Enums"]["application_status"] | null
          submission_url: string | null
          submitted_at: string | null
          uniqueness_score: number | null
          updated_at: string | null
        }
        Insert: {
          content_embedding?: string | null
          created_at?: string | null
          deadline?: string | null
          draft_content?: Json | null
          draft_docx_url?: string | null
          draft_pdf_url?: string | null
          entity_id?: string | null
          feedback_requested_at?: string | null
          grant_id?: string | null
          grant_match_id?: string | null
          humanizer_applied?: boolean | null
          id?: string
          loi_submission_id?: string | null
          outcome?: Database["public"]["Enums"]["outcome_status"] | null
          outcome_amount?: number | null
          qa_passed?: boolean | null
          qa_retry_count?: number | null
          qa_scores?: Json | null
          rejection_reason?: string | null
          research_notes?: Json | null
          selected_angles?: string[] | null
          selected_framework?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submission_url?: string | null
          submitted_at?: string | null
          uniqueness_score?: number | null
          updated_at?: string | null
        }
        Update: {
          content_embedding?: string | null
          created_at?: string | null
          deadline?: string | null
          draft_content?: Json | null
          draft_docx_url?: string | null
          draft_pdf_url?: string | null
          entity_id?: string | null
          feedback_requested_at?: string | null
          grant_id?: string | null
          grant_match_id?: string | null
          humanizer_applied?: boolean | null
          id?: string
          loi_submission_id?: string | null
          outcome?: Database["public"]["Enums"]["outcome_status"] | null
          outcome_amount?: number | null
          qa_passed?: boolean | null
          qa_retry_count?: number | null
          qa_scores?: Json | null
          rejection_reason?: string | null
          research_notes?: Json | null
          selected_angles?: string[] | null
          selected_framework?: string | null
          status?: Database["public"]["Enums"]["application_status"] | null
          submission_url?: string | null
          submitted_at?: string | null
          uniqueness_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_applications_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_grant_match_id_fkey"
            columns: ["grant_match_id"]
            isOneToOne: false
            referencedRelation: "grant_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_applications_loi_submission_id_fkey"
            columns: ["loi_submission_id"]
            isOneToOne: false
            referencedRelation: "loi_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_cycles: {
        Row: {
          award_date: string | null
          close_date: string | null
          created_at: string | null
          grant_id: string | null
          id: string
          open_date: string | null
          predicted_next_open: string | null
          recipients: Json | null
          year: number
        }
        Insert: {
          award_date?: string | null
          close_date?: string | null
          created_at?: string | null
          grant_id?: string | null
          id?: string
          open_date?: string | null
          predicted_next_open?: string | null
          recipients?: Json | null
          year: number
        }
        Update: {
          award_date?: string | null
          close_date?: string | null
          created_at?: string | null
          grant_id?: string | null
          id?: string
          open_date?: string | null
          predicted_next_open?: string | null
          recipients?: Json | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "grant_cycles_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grant_matches: {
        Row: {
          competitive_density_score: number | null
          created_at: string | null
          entity_id: string | null
          fit_score: number | null
          grant_id: string | null
          hard_filter_failures: string[] | null
          hard_filter_passed: boolean
          id: string
          matched_angles: string[] | null
          score_components: Json | null
          status: Database["public"]["Enums"]["match_status"] | null
        }
        Insert: {
          competitive_density_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          fit_score?: number | null
          grant_id?: string | null
          hard_filter_failures?: string[] | null
          hard_filter_passed: boolean
          id?: string
          matched_angles?: string[] | null
          score_components?: Json | null
          status?: Database["public"]["Enums"]["match_status"] | null
        }
        Update: {
          competitive_density_score?: number | null
          created_at?: string | null
          entity_id?: string | null
          fit_score?: number | null
          grant_id?: string | null
          hard_filter_failures?: string[] | null
          hard_filter_passed?: boolean
          id?: string
          matched_angles?: string[] | null
          score_components?: Json | null
          status?: Database["public"]["Enums"]["match_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "grant_matches_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grant_matches_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      grants: {
        Row: {
          application_url: string | null
          award_max: number | null
          award_min: number | null
          category_tags: string[] | null
          coalition_preferred: boolean | null
          competition_estimate: number | null
          content_hash: string | null
          created_at: string | null
          deadline: string | null
          description: string | null
          description_embedding: string | null
          eligibility_tags: string[] | null
          eligibility_text: string | null
          funder_name: string | null
          funder_type: Database["public"]["Enums"]["funder_type"] | null
          geographic_restrictions: Json | null
          id: string
          is_new_program: boolean | null
          loi_deadline: string | null
          predicted_reopen_date: string | null
          raw_html_snapshot: string | null
          requires_loi: boolean | null
          requires_video: boolean | null
          source: string
          source_url: string | null
          status: Database["public"]["Enums"]["grant_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          application_url?: string | null
          award_max?: number | null
          award_min?: number | null
          category_tags?: string[] | null
          coalition_preferred?: boolean | null
          competition_estimate?: number | null
          content_hash?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          description_embedding?: string | null
          eligibility_tags?: string[] | null
          eligibility_text?: string | null
          funder_name?: string | null
          funder_type?: Database["public"]["Enums"]["funder_type"] | null
          geographic_restrictions?: Json | null
          id?: string
          is_new_program?: boolean | null
          loi_deadline?: string | null
          predicted_reopen_date?: string | null
          raw_html_snapshot?: string | null
          requires_loi?: boolean | null
          requires_video?: boolean | null
          source: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["grant_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          application_url?: string | null
          award_max?: number | null
          award_min?: number | null
          category_tags?: string[] | null
          coalition_preferred?: boolean | null
          competition_estimate?: number | null
          content_hash?: string | null
          created_at?: string | null
          deadline?: string | null
          description?: string | null
          description_embedding?: string | null
          eligibility_tags?: string[] | null
          eligibility_text?: string | null
          funder_name?: string | null
          funder_type?: Database["public"]["Enums"]["funder_type"] | null
          geographic_restrictions?: Json | null
          id?: string
          is_new_program?: boolean | null
          loi_deadline?: string | null
          predicted_reopen_date?: string | null
          raw_html_snapshot?: string | null
          requires_loi?: boolean | null
          requires_video?: boolean | null
          source?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["grant_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      impact_metrics: {
        Row: {
          entity_id: string | null
          geography: string | null
          id: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          source: string | null
          time_period: string | null
          updated_at: string | null
        }
        Insert: {
          entity_id?: string | null
          geography?: string | null
          id?: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          source?: string | null
          time_period?: string | null
          updated_at?: string | null
        }
        Update: {
          entity_id?: string | null
          geography?: string | null
          id?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          source?: string | null
          time_period?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_metrics_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      loi_submissions: {
        Row: {
          created_at: string | null
          entity_id: string | null
          full_application_triggered: boolean | null
          grant_id: string | null
          id: string
          loi_content: string | null
          loi_pdf_url: string | null
          status: Database["public"]["Enums"]["loi_status"] | null
          submitted_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          full_application_triggered?: boolean | null
          grant_id?: string | null
          id?: string
          loi_content?: string | null
          loi_pdf_url?: string | null
          status?: Database["public"]["Enums"]["loi_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          full_application_triggered?: boolean | null
          grant_id?: string | null
          id?: string
          loi_content?: string | null
          loi_pdf_url?: string | null
          status?: Database["public"]["Enums"]["loi_status"] | null
          submitted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loi_submissions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loi_submissions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      partner_organizations: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: string
          location: string | null
          mission: string | null
          name: string
          prior_collaborations: Json | null
          relationship_strength:
            | Database["public"]["Enums"]["relationship_strength"]
            | null
          type: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          mission?: string | null
          name: string
          prior_collaborations?: Json | null
          relationship_strength?:
            | Database["public"]["Enums"]["relationship_strength"]
            | null
          type?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: string
          location?: string | null
          mission?: string | null
          name?: string
          prior_collaborations?: Json | null
          relationship_strength?:
            | Database["public"]["Enums"]["relationship_strength"]
            | null
          type?: string | null
        }
        Relationships: []
      }
      program_officers: {
        Row: {
          contact_history: Json | null
          created_at: string | null
          email: string | null
          focus_areas: string[] | null
          funder_id: string | null
          funder_name: string
          id: string
          last_outreach_date: string | null
          linkedin_url: string | null
          name: string | null
          relationship_strength:
            | Database["public"]["Enums"]["relationship_strength"]
            | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          contact_history?: Json | null
          created_at?: string | null
          email?: string | null
          focus_areas?: string[] | null
          funder_id?: string | null
          funder_name: string
          id?: string
          last_outreach_date?: string | null
          linkedin_url?: string | null
          name?: string | null
          relationship_strength?:
            | Database["public"]["Enums"]["relationship_strength"]
            | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          contact_history?: Json | null
          created_at?: string | null
          email?: string | null
          focus_areas?: string[] | null
          funder_id?: string | null
          funder_name?: string
          id?: string
          last_outreach_date?: string | null
          linkedin_url?: string | null
          name?: string | null
          relationship_strength?:
            | Database["public"]["Enums"]["relationship_strength"]
            | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_officers_funder_id_fkey"
            columns: ["funder_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          grants_found: number | null
          grants_new: number | null
          id: string
          source: string
          started_at: string | null
          success: boolean | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          grants_found?: number | null
          grants_new?: number | null
          id?: string
          source: string
          started_at?: string | null
          success?: boolean | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          grants_found?: number | null
          grants_new?: number | null
          id?: string
          source?: string
          started_at?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      video_submissions: {
        Row: {
          ai_disclosure_included: boolean | null
          approved_at: string | null
          created_at: string | null
          duration_seconds: number | null
          entity_id: string | null
          grant_id: string | null
          grant_match_id: string | null
          heygen_video_id: string | null
          id: string
          render_status: Database["public"]["Enums"]["render_status"] | null
          script_content: string | null
          submitted_at: string | null
          updated_at: string | null
          video_url: string | null
          voice_id: string | null
        }
        Insert: {
          ai_disclosure_included?: boolean | null
          approved_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          grant_id?: string | null
          grant_match_id?: string | null
          heygen_video_id?: string | null
          id?: string
          render_status?: Database["public"]["Enums"]["render_status"] | null
          script_content?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          video_url?: string | null
          voice_id?: string | null
        }
        Update: {
          ai_disclosure_included?: boolean | null
          approved_at?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          entity_id?: string | null
          grant_id?: string | null
          grant_match_id?: string | null
          heygen_video_id?: string | null
          id?: string
          render_status?: Database["public"]["Enums"]["render_status"] | null
          script_content?: string | null
          submitted_at?: string | null
          updated_at?: string | null
          video_url?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_submissions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "business_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_grant_id_fkey"
            columns: ["grant_id"]
            isOneToOne: false
            referencedRelation: "grants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_submissions_grant_match_id_fkey"
            columns: ["grant_match_id"]
            isOneToOne: false
            referencedRelation: "grant_matches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      append_entity_document: {
        Args: { doc_url: string; entity_id: string }
        Returns: undefined
      }
    }
    Enums: {
      application_status:
        | "drafting"
        | "qa_failed"
        | "pending_review"
        | "approved"
        | "submitted"
        | "rejected"
        | "withdrawn"
      funder_type: "federal" | "state" | "foundation" | "corporate" | "niche"
      grant_status: "active" | "expired" | "archived"
      loi_status: "draft" | "submitted" | "accepted" | "rejected"
      match_status:
        | "queued"
        | "drafting"
        | "qa_review"
        | "pending_review"
        | "approved"
        | "submitted"
        | "rejected"
        | "archived"
      outcome_status: "pending" | "awarded" | "rejected" | "withdrawn"
      relationship_strength: "none" | "aware" | "warm" | "strong"
      render_status:
        | "pending"
        | "rendering"
        | "ready"
        | "approved"
        | "rejected"
        | "submitted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      application_status: [
        "drafting",
        "qa_failed",
        "pending_review",
        "approved",
        "submitted",
        "rejected",
        "withdrawn",
      ],
      funder_type: ["federal", "state", "foundation", "corporate", "niche"],
      grant_status: ["active", "expired", "archived"],
      loi_status: ["draft", "submitted", "accepted", "rejected"],
      match_status: [
        "queued",
        "drafting",
        "qa_review",
        "pending_review",
        "approved",
        "submitted",
        "rejected",
        "archived",
      ],
      outcome_status: ["pending", "awarded", "rejected", "withdrawn"],
      relationship_strength: ["none", "aware", "warm", "strong"],
      render_status: [
        "pending",
        "rendering",
        "ready",
        "approved",
        "rejected",
        "submitted",
      ],
    },
  },
} as const
