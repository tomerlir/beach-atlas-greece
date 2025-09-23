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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          hero_photo_url: string | null
          hero_photo_source: string | null
          created_at: string
          updated_at: string
          status: 'DRAFT' | 'HIDDEN' | 'ACTIVE'
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          hero_photo_url?: string | null
          hero_photo_source?: string | null
          created_at?: string
          updated_at?: string
          status?: 'DRAFT' | 'HIDDEN' | 'ACTIVE'
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          hero_photo_url?: string | null
          hero_photo_source?: string | null
          created_at?: string
          updated_at?: string
          status?: 'DRAFT' | 'HIDDEN' | 'ACTIVE'
        }
        Relationships: []
      }
      beaches: {
        Row: {
          amenities: string[]
          blue_flag: boolean
          created_at: string
          description: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          organized: boolean
          parking: string
          photo_url: string | null
          photo_source: string | null
          area: string
          area_id: string | null
          slug: string
          source: string | null
          status: 'ACTIVE' | 'HIDDEN' | 'DRAFT'
          type: 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER'
          wave_conditions: 'CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE'
          verified_at: string | null
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          blue_flag?: boolean
          created_at?: string
          description?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          organized?: boolean
          parking: 'NONE' | 'ROADSIDE' | 'SMALL_LOT' | 'LARGE_LOT'
          photo_url?: string | null
          photo_source?: string | null
          area: string
          area_id?: string | null
          slug: string
          source?: string | null
          status?: 'ACTIVE' | 'HIDDEN' | 'DRAFT'
          type: 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER'
          wave_conditions: 'CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE'
          verified_at?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          blue_flag?: boolean
          created_at?: string
          description?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          organized?: boolean
          parking?: 'NONE' | 'ROADSIDE' | 'SMALL_LOT' | 'LARGE_LOT'
          photo_url?: string | null
          photo_source?: string | null
          area?: string
          area_id?: string | null
          slug?: string
          source?: string | null
          status?: 'ACTIVE' | 'HIDDEN' | 'DRAFT'
          type?: 'SANDY' | 'PEBBLY' | 'MIXED' | 'OTHER'
          wave_conditions?: 'CALM' | 'MODERATE' | 'WAVY' | 'SURFABLE'
          verified_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_log: {
        Row: {
          id: string
          admin_user_id: string
          action: string
          target_user_id: string | null
          details: any | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_user_id: string
          action: string
          target_user_id?: string | null
          details?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_user_id?: string
          action?: string
          target_user_id?: string | null
          details?: any | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_users_for_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          role: string
          created_at: string
          last_sign_in: string | null
        }[]
      }
      get_user_management_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          role: string
          created_at: string
          last_sign_in: string | null
          is_verified: boolean
        }[]
      }
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      can_access_admin_functions: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      promote_to_admin: {
        Args: {
          target_user_id: string
        }
        Returns: boolean
      }
      demote_from_admin: {
        Args: {
          target_user_id: string
        }
        Returns: boolean
      }
      bootstrap_first_admin: {
        Args: {
          admin_email: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action_type: string
          target_user_id?: string
          action_details?: any
        }
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
