import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
  namespace: '/deployments',
})
export class DeploymentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(DeploymentsGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:deployment')
  handleSubscribeToDeployment(
    client: Socket,
    deploymentId: string,
  ) {
    const room = `deployment:${deploymentId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} subscribed to ${room}`);
    client.emit('subscribed', { deploymentId });
  }

  @SubscribeMessage('unsubscribe:deployment')
  handleUnsubscribeFromDeployment(
    client: Socket,
    deploymentId: string,
  ) {
    const room = `deployment:${deploymentId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} unsubscribed from ${room}`);
  }

  streamBuildLog(deploymentId: string, logLine: string) {
    this.server
      .to(`deployment:${deploymentId}`)
      .emit('build:log', { deploymentId, line: logLine, timestamp: new Date().toISOString() });
  }

  streamBuildStatus(deploymentId: string, status: string, buildStage?: string) {
    this.server
      .to(`deployment:${deploymentId}`)
      .emit('build:status', { deploymentId, status, buildStage, timestamp: new Date().toISOString() });
  }
}
