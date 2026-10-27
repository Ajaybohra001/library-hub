import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class StaffGuard implements CanActivate {
  // Remove this temporary guard when Feature 2 authentication lands.
  canActivate(): boolean {
    throw new UnauthorizedException('Authentication is not available yet');
  }
}
