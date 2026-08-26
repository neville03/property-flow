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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      application_links: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          property_id: string
          token: string
          unit_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          property_id: string
          token: string
          unit_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          property_id?: string
          token?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_links_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_links_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          access_code: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          lease_months: number | null
          link_id: string | null
          move_in_date: string | null
          national_id: string | null
          notes: string | null
          occupants: number | null
          phone: string
          property_id: string
          stage: Database["public"]["Enums"]["application_stage"]
          unit_id: string | null
        }
        Insert: {
          access_code: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          lease_months?: number | null
          link_id?: string | null
          move_in_date?: string | null
          national_id?: string | null
          notes?: string | null
          occupants?: number | null
          phone: string
          property_id: string
          stage?: Database["public"]["Enums"]["application_stage"]
          unit_id?: string | null
        }
        Update: {
          access_code?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          lease_months?: number | null
          link_id?: string | null
          move_in_date?: string | null
          national_id?: string | null
          notes?: string | null
          occupants?: number | null
          phone?: string
          property_id?: string
          stage?: Database["public"]["Enums"]["application_stage"]
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "application_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          application_id: string
          created_at: string
          file_path: string
          id: string
          kind: string
          original_name: string | null
          property_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_path: string
          id?: string
          kind: string
          original_name?: string | null
          property_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_path?: string
          id?: string
          kind?: string
          original_name?: string | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          property_id: string
          spent_on: string
          status: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          property_id: string
          spent_on?: string
          status?: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string
          spent_on?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          application_id: string | null
          created_at: string
          id: string
          lease_months: number | null
          property_id: string
          rent: number
          start_date: string | null
          status: string
          tenant_name: string
          tenant_phone: string | null
          unit_id: string
        }
        Insert: {
          application_id?: string | null
          created_at?: string
          id?: string
          lease_months?: number | null
          property_id: string
          rent?: number
          start_date?: string | null
          status?: string
          tenant_name: string
          tenant_phone?: string | null
          unit_id: string
        }
        Update: {
          application_id?: string | null
          created_at?: string
          id?: string
          lease_months?: number | null
          property_id?: string
          rent?: number
          start_date?: string | null
          status?: string
          tenant_name?: string
          tenant_phone?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leases_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          contractor: string | null
          cost: number
          created_at: string
          description: string
          id: string
          logged_on: string
          property_id: string
          status: string
          unit_id: string | null
        }
        Insert: {
          contractor?: string | null
          cost?: number
          created_at?: string
          description: string
          id?: string
          logged_on?: string
          property_id: string
          status?: string
          unit_id?: string | null
        }
        Update: {
          contractor?: string | null
          cost?: number
          created_at?: string
          description?: string
          id?: string
          logged_on?: string
          property_id?: string
          status?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          lease_id: string | null
          method: string | null
          paid_on: string
          property_id: string
          reference: string | null
          status: string
          tenant_name: string | null
          unit_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string | null
          method?: string | null
          paid_on?: string
          property_id: string
          reference?: string | null
          status?: string
          tenant_name?: string | null
          unit_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          lease_id?: string | null
          method?: string | null
          paid_on?: string
          property_id?: string
          reference?: string | null
          status?: string
          tenant_name?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          owner_id: string
          status: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          owner_id: string
          status?: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          owner_id?: string
          status?: string
          type?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          assigned_on: string | null
          contact: string | null
          created_at: string
          id: string
          name: string
          property_id: string
          role: string | null
          salary: number | null
          status: string
        }
        Insert: {
          assigned_on?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name: string
          property_id: string
          role?: string | null
          salary?: number | null
          status?: string
        }
        Update: {
          assigned_on?: string | null
          contact?: string | null
          created_at?: string
          id?: string
          name?: string
          property_id?: string
          role?: string | null
          salary?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          bedrooms: number | null
          created_at: string
          id: string
          number: string
          property_id: string
          rent: number
          status: string
        }
        Insert: {
          bedrooms?: number | null
          created_at?: string
          id?: string
          number: string
          property_id: string
          rent?: number
          status?: string
        }
        Update: {
          bedrooms?: number | null
          created_at?: string
          id?: string
          number?: string
          property_id?: string
          rent?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_applicant_document: {
        Args: {
          _application_id: string
          _code: string
          _file_path: string
          _kind: string
          _original_name: string
        }
        Returns: string
      }
      can_manage_property: { Args: { _property_id: string }; Returns: boolean }
      get_applicant_portal: {
        Args: { _application_id: string; _code: string }
        Returns: Json
      }
      get_application_form: { Args: { _token: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved: { Args: { _user_id: string }; Returns: boolean }
      submit_application: {
        Args: {
          _date_of_birth: string
          _email: string
          _full_name: string
          _gender: string
          _lease_months: number
          _move_in_date: string
          _national_id: string
          _notes: string
          _occupants: number
          _phone: string
          _token: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "owner" | "tenant"
      application_stage: "new" | "contacted" | "approved" | "rejected"
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
      app_role: ["admin", "owner", "tenant"],
      application_stage: ["new", "contacted", "approved", "rejected"],
    },
  },
} as const
