import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginCredentialsDto, RegisterUserDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Creates a new user' })
  @ApiResponse({
    status: 201,
    description: 'Registration successfully',
    example: {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rasdneoafjdlncadsiybihwcxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
  })
  @ApiResponse({ status: 409, description: 'user already exists' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    example: {
      message: ['password is not strong enough', 'email must be an email'],
    },
  })
  async signUp(
    @Body() registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    return await this.authService.register(registerUserDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'login user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    example: {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.rasdneoafjdlncadsiybihwcxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    example: {
      message: [
        'email must be an email',
        'verificationCode should not be empty',
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    example: {
      message: [
        'email must be an email',
        'verificationCode should not be empty',
      ],
    },
  })
  @HttpCode(200)
  async signIn(
    @Body() LoginCredentialsDto: LoginCredentialsDto,
  ): Promise<{ accessToken: string }> {
    return await this.authService.login(LoginCredentialsDto);
  }
}
