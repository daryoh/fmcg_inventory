import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import {
  CreateProductDto,
  GetProductsFilterDto,
  UpdateProductDto,
} from './dto';
import { User } from '../auth/models';
import { GetUser } from '../auth/decorators';
import { JwtAuthGuard } from '../auth/guards';

@Controller('products')
@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200 })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, example: 10 })
  async getAllPosts(
    @Query() filters: GetProductsFilterDto,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return await this.productService.getAllProducts(page, pageSize, filters);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get product' })
  @ApiResponse({ status: 200 })
  async getProduct(@Param('id') id: string) {
    return await this.productService.getProduct(id);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete my product' })
  @ApiResponse({ status: 200 })
  async deleteUser(@Param('id') id: string, @GetUser() { id: userId }: User) {
    return await this.productService.deleteProduct(id, userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 200 })
  async createPost(@GetUser() user: User, @Body() payload: CreateProductDto) {
    return await this.productService.createProduct(user, payload);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Edit product' })
  @ApiResponse({ status: 200 })
  async updatePost(
    @Param('id') id: string,
    @GetUser() { id: userId }: User,
    @Body() payload: UpdateProductDto,
  ) {
    return await this.productService.updateProduct(userId, id, payload);
  }
}
