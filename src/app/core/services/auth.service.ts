import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

type RuntimeWindow = Window & {
  __env?: {
    AUTH_API_URL?: string;
  };
};

const authApiUrl =
  (window as RuntimeWindow).__env?.AUTH_API_URL ?? 'http://localhost:8081/api/auth';
const tokenStorageKey = 'jwt_token';

export interface UserInfo {
  id: string;
  nombre: string;
  rol: string;
  email: string;
  departamento?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = authApiUrl;
  private http = inject(HttpClient);
  private router = inject(Router);

  private currenUserSubject = new BehaviorSubject<UserInfo | null>(null);
  public currentUser$ = this.currenUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if (response.token) {
          sessionStorage.setItem(tokenStorageKey, response.token);
          this.decodeAndSetUser(response.token);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(tokenStorageKey);
    this.currenUserSubject.next(null);
    this.router.navigate(['/home']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(tokenStorageKey);
  }

  getUserRole(): string | null {
    return this.currenUserSubject.value?.rol || null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      try {
        this.decodeAndSetUser(token);
      } catch (e) {
        this.logout();
      }
    }
  }

  private decodeAndSetUser(token: string): void {
    const decoded: any = jwtDecode(token);
    const userInfo: UserInfo = {
      id: decoded.id,
      nombre: decoded.nombre,
      rol: decoded.rol,
      email: decoded.sub,
      departamento: decoded.departamento
    };
    this.currenUserSubject.next(userInfo);
  }

  redirectBasedOnRole(): void {
    const role = this.getUserRole();
    switch (role) {
      case 'ROLE_ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'ROLE_DESIGNER':
        this.router.navigate(['/designer']);
        break;
      case 'ROLE_EMPLEADO':
        this.router.navigate(['/employee']);
        break;
      case 'ROLE_CLIENTE':
        this.router.navigate(['/client']);
        break;
      default:
        this.router.navigate(['/home']);
    }
  }
}
