import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import {
  AdminDashboardVm,
  AdminMetric,
  AdminNotification,
  AdminRole,
  AdminUser,
  AdminUserCreate,
  AdminUserUpdate,
  AdminDepartment,
  AdminAuditLog
} from '../data/admin-dashboard.data';

type RuntimeWindow = Window & {
  __env?: {
    API_BASE_URL?: string;
  };
};

const apiBaseUrl =
  (window as RuntimeWindow).__env?.API_BASE_URL ?? 'http://localhost:8081/api';

type UsuarioResponseDto = {
  id: string;
  email: string;
  nombre: string;
  departamentos: string[];
  rol: string;
  estadoConexion: boolean;
  ultimaConexion: string | null;
};

type WorkflowResponseDto = {
  id: string;
  nombre: string;
  descripcion: string;
};

type RolResponseDto = {
  id: string;
  nombre: string;
};

type NotificacionResponseDto = {
  id: string;
  usuarioId: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fecha: string;
};

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = `${apiBaseUrl}/api/usuarios`;
  private readonly rolesUrl = `${apiBaseUrl}/api/roles`;
  private readonly workflowsUrl = `${apiBaseUrl}/api/workflows`;
  private readonly notificacionesUrl = `${apiBaseUrl}/api/notificaciones`;
  private readonly departamentosUrl = `${apiBaseUrl}/api/departamentos`;
  private readonly bitacoraUrl = `${apiBaseUrl}/api/bitacora`;

  getDashboardData(): Observable<AdminDashboardVm> {
    return forkJoin({
      roles: this.http.get<RolResponseDto[]>(this.rolesUrl).pipe(catchError(() => of([]))),
      usuarios: this.http.get<UsuarioResponseDto[]>(this.usuariosUrl).pipe(catchError(() => of([]))),
      usuariosInactivos: this.http.get<UsuarioResponseDto[]>(`${this.usuariosUrl}/inactivos`).pipe(catchError(() => of([]))),
      workflows: this.http.get<WorkflowResponseDto[]>(this.workflowsUrl).pipe(catchError(() => of([]))),
      notificaciones: this.http.get<NotificacionResponseDto[]>(this.notificacionesUrl).pipe(catchError(() => of([]))),
      departamentos: this.http.get<AdminDepartment[]>(this.departamentosUrl).pipe(catchError(() => of([]))),
      bitacora: this.http.get<AdminAuditLog[]>(this.bitacoraUrl).pipe(catchError(() => of([])))
    }).pipe(
      map(({ roles, usuarios, usuariosInactivos, workflows, notificaciones, departamentos, bitacora }) => ({
        metrics: this.buildMetrics(usuarios, workflows, notificaciones),
        roles: roles
          .filter((role) => role.nombre !== 'ROLE_USER')
          .map((role) => this.mapRole(role)),
        departments: departamentos,
        auditLogs: bitacora,
        inactiveUsers: usuariosInactivos.length,
        activeUsers: usuarios.map((user) => this.mapUser(user)),
        inactiveUserList: usuariosInactivos.map((user) => this.mapUser(user)),
        recentUsers: usuarios.slice(0, 5).map((user) => this.mapUser(user)),
        recentNotifications: notificaciones.slice(0, 5).map((notification) => this.mapNotification(notification))
      }))
    );
  }

  deactivateUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.usuariosUrl}/${userId}`);
  }

  restoreUser(userId: string): Observable<void> {
    return this.http.put<void>(`${this.usuariosUrl}/${userId}/restaurar`, {});
  }

  createUser(user: AdminUserCreate): Observable<UsuarioResponseDto> {
    return this.http.post<UsuarioResponseDto>(this.usuariosUrl, user);
  }

  updateUser(user: AdminUserUpdate): Observable<UsuarioResponseDto> {
    const { id, ...payload } = user;
    return this.http.put<UsuarioResponseDto>(`${this.usuariosUrl}/${id}`, payload);
  }

  getDepartments(): Observable<AdminDepartment[]> {
    return this.http.get<AdminDepartment[]>(this.departamentosUrl);
  }

  createDepartment(dept: AdminDepartment): Observable<AdminDepartment> {
    return this.http.post<AdminDepartment>(this.departamentosUrl, dept);
  }

  updateDepartment(dept: AdminDepartment): Observable<AdminDepartment> {
    return this.http.put<AdminDepartment>(`${this.departamentosUrl}/${dept.id}`, dept);
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.departamentosUrl}/${id}`);
  }


  private buildMetrics(
    usuarios: UsuarioResponseDto[],
    workflows: WorkflowResponseDto[],
    notificaciones: NotificacionResponseDto[]
  ): AdminMetric[] {
    return [
      {
        title: 'Usuarios',
        value: String(usuarios.length),
        icon: 'pi pi-users',
        iconClass: 'bg-blue-100 text-blue-600'
      },
      {
        title: 'Workflows Activos',
        value: String(workflows.length),
        icon: 'pi pi-sitemap',
        iconClass: 'bg-green-100 text-green-600'
      },
      {
        title: 'Notificaciones',
        value: String(notificaciones.length),
        icon: 'pi pi-bell',
        iconClass: 'bg-orange-100 text-orange-600'
      }
    ];
  }

  private mapUser(user: UsuarioResponseDto): AdminUser {
    return {
      id: user.id,
      name: user.nombre,
      email: user.email,
      role: this.formatRoleLabel(user.rol),
      departments: user.departamentos || []
    };
  }

  private mapRole(role: RolResponseDto): AdminRole {
    return {
      id: role.id,
      name: this.formatRoleLabel(role.nombre)
    };
  }

  private formatRoleLabel(roleName: string): string {
    const roleLabels: Record<string, string> = {
      ROLE_ADMIN: 'Administrador',
      ROLE_EMPLEADO: 'Funcionario',
      ROLE_DESIGNER: 'Diseñador de flujo',
      ROLE_CLIENTE: 'Cliente',
      ROLE_USER: 'Usuario'
    };

    return roleLabels[roleName] ?? roleName;
  }

  private mapNotification(notification: NotificacionResponseDto): AdminNotification {
    return {
      id: notification.id,
      message: notification.mensaje,
      type: notification.tipo,
      read: notification.leido
    };
  }
}
