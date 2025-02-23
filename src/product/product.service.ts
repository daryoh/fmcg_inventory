import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import {
  CreateProductDto,
  GetProductsFilterDto,
  UpdateProductDto,
} from './dto';
import { Product } from './models/product.entity';
import { User } from '../auth/models';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async getAllProducts(
    page: number,
    pageSize: number,
    filters: GetProductsFilterDto,
  ) {
    page = Math.max(1, Number(page) || 1);
    pageSize = Math.min(50, Math.max(1, Number(pageSize) || 10));

    const where: FindOptionsWhere<Product> = {};

    if (filters.title) {
      where.title = ILike(`%${filters.title}%`);
    }

    if (filters.userId) {
      where.user = {
        id: filters.userId,
      };
    }

    const [data, total] = await this.productRepository.findAndCount({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      select: {
        id: true,
        title: true,
        quantity: true,
      },
    });

    return {
      data,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getProduct(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['user'],
      select: {
        user: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    });

    if (!product) {
      throw new NotFoundException();
    }

    return product;
  }

  async deleteProduct(id: string, userId: string) {
    const product = await this.getUserProduct(userId, id);
    await this.productRepository.remove(product);

    return { message: 'Product deleted successfully' };
  }

  async createProduct(user: User, payload: CreateProductDto) {
    const product = this.productRepository.create({
      ...payload,
      user: { id: user.id },
    });

    await this.productRepository.save(product);
    return {
      message: 'Product created successfully',
      product,
    };
  }

  async updateProduct(userId: string, id: string, payload: UpdateProductDto) {
    const product = await this.getUserProduct(userId, id);
    const { title, description, quantity, price } = payload;

    Object.assign(product, {
      title: title ?? product.title,
      description: description ?? product.description,
      price: price ?? product.price,
      quantity: quantity ?? product.quantity,
    });

    await this.productRepository.save(product);
    return {
      message: 'Product updated successfully',
      productId: id,
    };
  }

  private async getUserProduct(userId: string, productId: string) {
    const product = await this.productRepository.findOne({
      where: { id: productId, user: { id: userId } },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException();
    }

    return product;
  }
}
