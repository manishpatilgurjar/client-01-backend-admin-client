import { 
  Controller, 
  Get, 
  Patch, 
  Post,
  Delete,
  Body, 
  Param,
  UsePipes, 
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
  Req
} from '@nestjs/common';
import { AboutUsService } from '../services/about-us.service';
import { UpdateAboutUsDto, AboutSectionDto, TeamMemberDto } from '../enums/about-us.dto';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';
import { FileUploadInterceptor } from '../../common/interceptors/file-upload.interceptor';

@Controller('admin/about-us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  /**
   * GET /admin/about-us
   * Get About Us information
   */
  @Get()
  async get() {
    const about = await this.aboutUsService.get();
    return new AdminSuccessResponse(AdminMessages.ABOUT_US_FETCHED_SUCCESS, about);
  }

  /**
   * PATCH /admin/about-us
   * Update About Us information (creates if doesn't exist)
   */
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Body() dto: UpdateAboutUsDto) {
    // TODO: Get user info from JWT token when auth is implemented
    const about = await this.aboutUsService.update(dto, undefined, 'admin', 'admin@example.com');
    return new AdminSuccessResponse(AdminMessages.ABOUT_US_UPDATED_SUCCESS, about);
  }

  /**
   * POST /admin/about-us/upload-main-image
   * Upload main image for About Us
   */
  @Post('upload-main-image')
  @UseInterceptors(FileUploadInterceptor)
  async uploadMainImage(@UploadedFile() file: Express.Multer.File) {
    try {
      const imageUrl = await this.aboutUsService.uploadMainImage(file);
      // Update the main image URL in the database
      await this.aboutUsService.updateMainImage(imageUrl);
      return new AdminSuccessResponse('Main image uploaded successfully', { imageUrl });
    } catch (error) {
      throw error;
    }
  }

  /**
   * POST /admin/about-us/upload-team-member-image
   * Upload image for team member
   */
  @Post('upload-team-member-image')
  @UseInterceptors(FileUploadInterceptor)
  async uploadTeamMemberImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.aboutUsService.uploadTeamMemberImage(file);
    return new AdminSuccessResponse('Team member image uploaded successfully', { imageUrl });
  }

  /**
   * POST /admin/about-us/upload-section-image
   * Upload image for about section
   */
  @Post('upload-section-image')
  @UseInterceptors(FileUploadInterceptor)
  async uploadSectionImage(@UploadedFile() file: Express.Multer.File) {
    const imageUrl = await this.aboutUsService.uploadSectionImage(file);
    return new AdminSuccessResponse('Section image uploaded successfully', { imageUrl });
  }

  // ==================== SECTION ENDPOINTS ====================

  /**
   * POST /admin/about-us/sections
   * Add new section
   */
  @Post('sections')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addSection(@Body() dto: AboutSectionDto) {
    const section = await this.aboutUsService.addSection(dto);
    return new AdminSuccessResponse('Section added successfully', section);
  }

  /**
   * GET /admin/about-us/sections/:id
   * Get section by ID
   */
  @Get('sections/:id')
  async getSection(@Param('id') id: string) {
    const section = await this.aboutUsService.getSection(id);
    return new AdminSuccessResponse('Section fetched successfully', section);
  }

  /**
   * PATCH /admin/about-us/sections/:id
   * Update section by ID
   */
  @Patch('sections/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateSection(@Param('id') id: string, @Body() dto: AboutSectionDto) {
    const section = await this.aboutUsService.updateSection(id, dto);
    return new AdminSuccessResponse('Section updated successfully', section);
  }

  /**
   * DELETE /admin/about-us/sections/:id
   * Delete section by ID
   */
  @Delete('sections/:id')
  async deleteSection(@Param('id') id: string) {
    const result = await this.aboutUsService.deleteSection(id);
    return new AdminSuccessResponse(result.message, {});
  }

  /**
   * POST /admin/about-us/sections/:id/upload-image
   * Upload image for specific section
   */
  @Post('sections/:id/upload-image')
  @UseInterceptors(FileUploadInterceptor)
  async uploadSectionImageById(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    try {
      const imageUrl = await this.aboutUsService.uploadSectionImage(file);
      await this.aboutUsService.updateSection(id, { image: imageUrl });
      return new AdminSuccessResponse('Section image uploaded successfully', { imageUrl });
    } catch (error) {
      throw error;
    }
  }

  // ==================== TEAM MEMBER ENDPOINTS ====================

  /**
   * POST /admin/about-us/team-members
   * Add new team member
   */
  @Post('team-members')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addTeamMember(@Body() dto: TeamMemberDto) {
    const member = await this.aboutUsService.addTeamMember(dto);
    return new AdminSuccessResponse('Team member added successfully', member);
  }

  /**
   * GET /admin/about-us/team-members/:id
   * Get team member by ID
   */
  @Get('team-members/:id')
  async getTeamMember(@Param('id') id: string) {
    const member = await this.aboutUsService.getTeamMember(id);
    return new AdminSuccessResponse('Team member fetched successfully', member);
  }

  /**
   * PATCH /admin/about-us/team-members/:id
   * Update team member by ID
   */
  @Patch('team-members/:id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateTeamMember(@Param('id') id: string, @Body() dto: TeamMemberDto) {
    const member = await this.aboutUsService.updateTeamMember(id, dto);
    return new AdminSuccessResponse('Team member updated successfully', member);
  }

  /**
   * DELETE /admin/about-us/team-members/:id
   * Delete team member by ID
   */
  @Delete('team-members/:id')
  async deleteTeamMember(@Param('id') id: string) {
    const result = await this.aboutUsService.deleteTeamMember(id);
    return new AdminSuccessResponse(result.message, {});
  }

  /**
   * POST /admin/about-us/team-members/:id/upload-image
   * Upload image for specific team member
   */
  @Post('team-members/:id/upload-image')
  @UseInterceptors(FileUploadInterceptor)
  async uploadTeamMemberImageById(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    try {
      const imageUrl = await this.aboutUsService.uploadTeamMemberImage(file);
      await this.aboutUsService.updateTeamMember(id, { image: imageUrl });
      return new AdminSuccessResponse('Team member image uploaded successfully', { imageUrl });
    } catch (error) {
      throw error;
    }
  }
} 