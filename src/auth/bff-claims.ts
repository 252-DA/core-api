export interface BffClaims {
  sub: string;
  courseId?: string;
  roles: string[];
  scope: 'course' | 'admin';
  jti: string;
  iat: number;
  exp: number;
}
