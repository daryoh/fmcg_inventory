import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './models';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginCredentialsDto, RegisterUserDto } from './dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from 'src/interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {}

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string; accessToken: string }> {
    try {
      const { email, password, firstName, lastName } = registerUserDto;

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = this.usersRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      });

      await this.usersRepository.save(user);

      const payload: JwtPayload = { id: user.id };
      const accessToken: string = this.jwtService.sign(payload, {
        expiresIn: '24h',
      });

      return {
        accessToken,
        message: 'Registration successfully',
      };
    } catch (error: any) {
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const dbError = error as { code: string };
        // handle postgres and sqlite duplicate errors
        if (dbError.code === '23505') {
          throw new ConflictException('User already exists');
        }
      }

      throw new InternalServerErrorException();
    }
  }

  async login(LoginCredentialsDto: LoginCredentialsDto): Promise<{
    accessToken: string;
    message: string;
  }> {
    const { email, password } = LoginCredentialsDto;
    const user: User = await this.usersRepository.findOne({
      where: { email },
      select: { id: true, password: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { id: user.id };
    const accessToken: string = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    return {
      accessToken,
      message: 'Login successful',
    };
  }
}
