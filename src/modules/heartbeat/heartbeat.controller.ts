import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { HeartbeatService } from './heartbeat.service';
import { HeartbeatDto } from './dto/heartbeat.dto';
import { Public } from '../auth/decorators/public.decorator';

/**
 * Heartbeat controller
 * Handles device heartbeat requests and maintains device online status
 *
 * Number of endpoints: 1
 * - POST /api/heartbeat - Receive device heartbeat
 */
@Controller('heartbeat')
export class HeartbeatController {
  constructor(private readonly HeartbeatService: HeartbeatService) {}

  /**
   * Receive device heartbeat
   * Processes heartbeat data sent by devices, updating the device online status and last active time
   *
   * Description:
   * - Validate device identity and token validity
   * - Update the device online status
   * - Record the device last active time
   * - Update device information (e.g. IP address, operating system)
   *
   * Security measures:
   * - Uses the @Public decorator, accessible without authentication (devices use their own token)
   * - Rate limiting enabled: at most 10 requests per minute
   *
   * @param HeartbeatDto heartbeat data transfer object containing device ID, token, and status information
   * @returns Returns a confirmation message on success
   * @throws UnauthorizedException device token is invalid or expired
   */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  receiveHeartbeat(@Body() HeartbeatDto: HeartbeatDto, @Req() req: Request) {
    return this.HeartbeatService.handleHeartbeat(
      HeartbeatDto,
      this.resolveClientIp(req),
    );
  }

  /**
   * Resolve the device source IP.
   * The console normally sits behind the web container's nginx proxy, so the
   * forwarded headers are preferred over the raw socket address.
   */
  private resolveClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    const firstForwarded = Array.isArray(forwarded)
      ? forwarded[0]
      : typeof forwarded === 'string'
        ? forwarded
        : '';
    const candidate =
      firstForwarded.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string | undefined)?.trim() ||
      req.ip ||
      '';
    // Keep IPv6-mapped IPv4 addresses readable and cap the stored length.
    const normalized = candidate.replace(/^::ffff:/, '');
    return normalized.slice(0, 45);
  }
}
