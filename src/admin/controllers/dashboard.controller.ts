import { 
  Controller, 
  Get
} from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';

@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /admin/dashboard
   * Get comprehensive dashboard data with all statistics, activity, and system health
   */
  @Get()
  async getDashboard() {
    const [
      dashboardData,
      productStats,
      recentProducts,
      systemHealth
    ] = await Promise.all([
      this.dashboardService.getDashboardData(),
      this.dashboardService.getProductStats(),
      this.dashboardService.getRecentProducts(5),
      this.dashboardService.getSystemHealth()
    ]);

    return new AdminSuccessResponse(AdminMessages.DASHBOARD_DATA_RETRIEVED_SUCCESS, {
      stats: {
        totalPages: dashboardData.totalPages,
        totalProducts: dashboardData.totalProducts,
        publishedProducts: dashboardData.publishedProducts,
        draftProducts: dashboardData.draftProducts,
        totalEnquiries: dashboardData.totalEnquiries,
        newEnquiriesThisWeek: dashboardData.newEnquiriesThisWeek,
        activeUsers: dashboardData.activeUsers,
        userGrowthThisMonth: dashboardData.userGrowthThisMonth
      },
      productStats: {
        total: productStats.total,
        published: productStats.published,
        draft: productStats.draft,
        archived: productStats.archived
      },
      recentActivity: dashboardData.recentActivity,
      recentProducts: {
        products: recentProducts,
        count: recentProducts.length
      },
      systemHealth: {
        database: systemHealth.database,
        products: systemHealth.products,
        pages: systemHealth.pages,
        overall: systemHealth.overall
      }
    });
  }
} 