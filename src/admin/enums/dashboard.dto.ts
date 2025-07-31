import { IsString, IsNumber, IsDateString, IsEnum } from 'class-validator';

export class DashboardStats {
  @IsNumber() totalPages: number;
  @IsNumber() totalProducts: number;
  @IsNumber() publishedProducts: number;
  @IsNumber() draftProducts: number;
  @IsNumber() totalEnquiries: number;
  @IsNumber() newEnquiriesThisWeek: number;
  @IsNumber() activeUsers: number;
  @IsNumber() userGrowthThisMonth: number;
}

export class RecentActivity {
  @IsString() action: string;
  @IsString() page: string;
  @IsDateString() time: string;
  @IsEnum(['edit', 'status', 'system', 'create', 'delete', 'update']) type: 'edit' | 'status' | 'system' | 'create' | 'delete' | 'update';
}

export class DashboardResponse {
  @IsNumber() totalPages: number;
  @IsNumber() totalProducts: number;
  @IsNumber() publishedProducts: number;
  @IsNumber() draftProducts: number;
  @IsNumber() totalEnquiries: number;
  @IsNumber() newEnquiriesThisWeek: number;
  @IsNumber() activeUsers: number;
  @IsNumber() userGrowthThisMonth: number;
  recentActivity: RecentActivity[];
} 