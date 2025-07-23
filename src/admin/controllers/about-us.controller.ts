import { Controller, Post, Get, Patch, Delete, Param, Body, UsePipes, ValidationPipe, Req, HttpCode } from '@nestjs/common';
import { AboutUsService } from '../services/about-us.service';
import { CreateAboutUsDto, UpdateAboutUsDto } from '../enums/about-us.dto';
import { AdminSuccessResponse } from '../enums/response';
import { AdminMessages } from '../enums/messages';

@Controller('admin/about-us')
export class AboutUsController {
  constructor(private readonly aboutUsService: AboutUsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async create(@Body() dto: CreateAboutUsDto) {
    const about = await this.aboutUsService.create(dto);
    return new AdminSuccessResponse('About Us created successfully', about);
  }

  @Get()
  async get() {
    const about = await this.aboutUsService.get();
    return new AdminSuccessResponse('About Us fetched successfully', about);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(@Param('id') id: string, @Body() dto: UpdateAboutUsDto) {
    const about = await this.aboutUsService.update(id, dto);
    return new AdminSuccessResponse('About Us updated successfully', about);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id') id: string) {
    await this.aboutUsService.delete(id);
    return;
  }
} 