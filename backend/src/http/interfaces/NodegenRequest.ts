import express from 'express';
import { JwtAccess } from '@/http/nodegen/interfaces';

declare global {
  namespace Express {
    export interface Request {
      jwtData: JwtAccess;
      originalToken: string;
      clientIp?: string;
    }
  }
}

type NodegenRequest = express.Request;
export default NodegenRequest;
