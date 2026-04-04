import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  private generateStrongPassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*_+-=';
    const all = upper + lower + digits + special;

    const chars = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    for (let i = chars.length; i < 12; i++) {
      chars.push(all[Math.floor(Math.random() * all.length)]);
    }
    return chars.sort(() => Math.random() - 0.5).join('');
  }

  async onModuleInit() {
    const superadmin = await this.userModel.findOne({
      $or: [{ role: 'superadmin' }, { username: 'admin' }],
    });

    // Super admin already exists, skip seed.
    if (superadmin) {
      return;
    }

    const password = this.generateStrongPassword();
    const hashedPassword = await bcrypt.hash('Aa1234567@', 10);
    const user = new this.userModel({
      username: 'admin',
      password: hashedPassword,
      role: 'superadmin',
    });
    await user.save();
    console.log(`Superadmin seeded: username=admin, password=${password}`);
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.userModel.findOne({
      username: registerDto.username,
    });
    if (existing) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = new this.userModel({
      username: registerDto.username,
      password: hashedPassword,
      role: 'user',
    });
    await user.save();

    return { username: user.username };
  }

  async validateUser(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (user && (await bcrypt.compare(password, user.password))) {
      return {
        userId: (user as any)._id.toString(),
        username: user.username,
        role: user.role,
      };
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.userId,
      username: user.username,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      username: user.username,
      role: user.role,
    };
  }

  async getUsers() {
    return this.userModel.find().select('-password').exec();
  }

  async deleteUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    if (user.role === 'superadmin') {
      throw new ForbiddenException('Cannot delete superadmin user');
    }
    await this.userModel.findByIdAndDelete(userId);
    return { message: 'User deleted successfully' };
  }
}
