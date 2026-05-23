import {
  Controller,
  All,
  Req,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import * as http from 'http';
import * as url from 'url';
import { RoutingService } from './routing.service';

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly routingService: RoutingService) {}

  @All('*')
  async handleRequest(@Req() req: Request, @Res() res: Response): Promise<void> {
    const host = req.headers.host?.split(':')[0]; // Remove port

    if (!host) {
      res.status(HttpStatus.BAD_REQUEST).json({ error: 'Missing Host header' });
      return;
    }

    try {
      const route = await this.routingService.resolveDomain(host);

      if (!route) {
        res.status(HttpStatus.NOT_FOUND).json({
          error: 'Deployment not found',
          message: `No deployment found for domain ${host}`,
        });
        return;
      }

      await this.proxyRequest(req, res, route.deploymentUrl);
    } catch (error) {
      this.logger.error(
        `Error proxying request for ${host}: ${(error as Error).message}`,
      );
      res.status(HttpStatus.BAD_GATEWAY).json({
        error: 'Bad Gateway',
        message: 'Failed to connect to deployment',
      });
    }
  }

  private proxyRequest(
    req: Request,
    res: Response,
    targetUrl: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsedUrl = url.parse(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';

      const path = req.originalUrl || req.url;
      const targetPath = `${parsedUrl.pathname === '/' ? '' : parsedUrl.pathname || ''}${path}`;

      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: targetPath,
        method: req.method,
        headers: {
          ...req.headers,
          host: parsedUrl.host || parsedUrl.hostname || '',
          'x-forwarded-for': req.ip || req.socket.remoteAddress || '',
          'x-forwarded-proto': req.protocol || 'https',
          'x-forwarded-host': req.headers.host || '',
          'x-deployx-deployment': 'true',
        },
      };

      // Remove hop-by-hop headers
      const headers = options.headers as Record<string, unknown>;
      delete headers['connection'];
      delete headers['transfer-encoding'];

      const proxyReq = http.request(
        {
          ...options,
          protocol: isHttps ? 'https:' : 'http:',
        } as any,
        (proxyRes: http.IncomingMessage) => {
          // Forward status code
          res.writeHead(proxyRes.statusCode || HttpStatus.INTERNAL_SERVER_ERROR, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
          proxyRes.on('end', resolve);
        },
      );

      proxyReq.on('error', (err: Error) => {
        this.logger.error(`Proxy request error: ${err.message}`);
        reject(err);
      });

      // Pipe request body
      if (req.body && Object.keys(req.body).length > 0) {
        proxyReq.write(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      }

      req.pipe(proxyReq, { end: true });
    });
  }
}
