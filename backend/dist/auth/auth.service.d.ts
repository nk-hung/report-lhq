import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private userModel;
    private jwtService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<{
        username: string;
    }>;
    validateUser(username: string, password: string): Promise<{
        userId: any;
        username: string;
    } | null>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        username: string;
    }>;
}
