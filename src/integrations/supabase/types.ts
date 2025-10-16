export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string;
          admin_user_id: string;
          created_at: string;
          details: Json | null;
          id: string;
          target_user_id: string | null;
        };
        Insert: {
          action: string;
          admin_user_id: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_user_id?: string | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          target_user_id?: string | null;
        };
        Relationships: [];
      };
      admin_invites: {
        Row: {
          accepted: boolean;
          accepted_at: string | null;
          created_at: string;
          email: string;
          email_lower: string | null;
          expires_at: string;
          id: string;
          invited_by: string;
          token: string;
        };
        Insert: {
          accepted?: boolean;
          accepted_at?: string | null;
          created_at?: string;
          email: string;
          email_lower?: string | null;
          expires_at?: string;
          id?: string;
          invited_by: string;
          token?: string;
        };
        Update: {
          accepted?: boolean;
          accepted_at?: string | null;
          created_at?: string;
          email?: string;
          email_lower?: string | null;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          token?: string;
        };
        Relationships: [];
      };
      areas: {
        Row: {
          created_at: string | null;
          description: string | null;
          hero_photo_source: string | null;
          hero_photo_url: string | null;
          id: string;
          name: string;
          slug: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          hero_photo_source?: string | null;
          hero_photo_url?: string | null;
          id?: string;
          name: string;
          slug: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          hero_photo_source?: string | null;
          hero_photo_url?: string | null;
          id?: string;
          name?: string;
          slug?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      beaches: {
        Row: {
          amenities: string[];
          area: string;
          area_id: string | null;
          blue_flag: boolean;
          created_at: string;
          description: string | null;
          id: string;
          latitude: number;
          longitude: number;
          name: string;
          organized: boolean;
          parking: string;
          photo_source: string | null;
          photo_url: string | null;
          slug: string;
          source: string | null;
          status: string;
          type: string;
          updated_at: string;
          verified_at: string | null;
          wave_conditions: string;
        };
        Insert: {
          amenities?: string[];
          area: string;
          area_id?: string | null;
          blue_flag?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude: number;
          longitude: number;
          name: string;
          organized?: boolean;
          parking: string;
          photo_source?: string | null;
          photo_url?: string | null;
          slug: string;
          source?: string | null;
          status?: string;
          type: string;
          updated_at?: string;
          verified_at?: string | null;
          wave_conditions: string;
        };
        Update: {
          amenities?: string[];
          area?: string;
          area_id?: string | null;
          blue_flag?: boolean;
          created_at?: string;
          description?: string | null;
          id?: string;
          latitude?: number;
          longitude?: number;
          name?: string;
          organized?: boolean;
          parking?: string;
          photo_source?: string | null;
          photo_url?: string | null;
          slug?: string;
          source?: string | null;
          status?: string;
          type?: string;
          updated_at?: string;
          verified_at?: string | null;
          wave_conditions?: string;
        };
        Relationships: [
          {
            foreignKeyName: "beaches_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          role: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          role?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          role?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      beaches_with_areas: {
        Row: {
          amenities: string[] | null;
          area: string | null;
          area_description: string | null;
          area_hero_photo_source: string | null;
          area_hero_photo_url: string | null;
          area_id: string | null;
          area_name: string | null;
          area_slug: string | null;
          blue_flag: boolean | null;
          created_at: string | null;
          description: string | null;
          id: string | null;
          latitude: number | null;
          longitude: number | null;
          name: string | null;
          organized: boolean | null;
          parking: string | null;
          photo_source: string | null;
          photo_url: string | null;
          slug: string | null;
          source: string | null;
          status: string | null;
          type: string | null;
          updated_at: string | null;
          verified_at: string | null;
          wave_conditions: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "beaches_area_id_fkey";
            columns: ["area_id"];
            isOneToOne: false;
            referencedRelation: "areas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      accept_admin_invite: {
        Args: { invite_token: string };
        Returns: boolean;
      };
      bootstrap_first_admin: {
        Args: { admin_email: string };
        Returns: boolean;
      };
      can_access_admin_functions: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      create_admin_invite: {
        Args: { invitee_email: string };
        Returns: string;
      };
      demote_from_admin: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
      get_all_users: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          email: string;
          last_sign_in: string;
          role: string;
          user_id: string;
        }[];
      };
      get_current_user_email: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_user_management_data: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          is_verified: boolean;
          last_sign_in: string;
          role: string;
          user_id: string;
        }[];
      };
      get_users_for_admin: {
        Args: Record<PropertyKey, never>;
        Returns: {
          created_at: string;
          email: string;
          last_sign_in: string;
          role: string;
          user_id: string;
        }[];
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      list_admin_invites: {
        Args: Record<PropertyKey, never>;
        Returns: {
          accepted: boolean;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
        }[];
      };
      log_admin_action: {
        Args: {
          action_details?: Json;
          action_type: string;
          target_user_id?: string;
        };
        Returns: undefined;
      };
      promote_to_admin: {
        Args: { target_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
