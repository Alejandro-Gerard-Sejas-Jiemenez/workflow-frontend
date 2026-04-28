import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, interval, switchMap, tap, catchError, of, filter, Subscription } from 'rxjs';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

export interface Notification {
  id: string;
  mensaje: string;
  tipo: string;
  leido: boolean;
  fecha: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSystemService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  
  private readonly notificationsSubject = new BehaviorSubject<Notification[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();
  
  private readonly apiUrl = 'http://localhost:8082/api/notificaciones/me';
  private pollingSubscription?: Subscription;

  constructor() {
    // Poll every 15 seconds if logged in
    this.pollingSubscription = interval(15000).pipe(
      filter(() => this.authService.isAuthenticated()),
      switchMap(() => this.getNotifications()),
      tap(notifs => {
        const currentCount = this.notificationsSubject.value.length;
        const unread = notifs.filter(n => !n.leido);
        
        // If there are new unread notifications that were not there before
        if (unread.length > 0 && notifs.length > currentCount) {
          const latest = notifs[notifs.length - 1];
          this.messageService.add({
            severity: latest.tipo === 'ALERTA' ? 'warn' : 'info',
            summary: 'Nueva Notificación',
            detail: latest.mensaje,
            life: 5000
          });
        }
        
        this.notificationsSubject.next(notifs);
      }),
      catchError(() => of([]))
    ).subscribe();
  }

  getNotifications() {
    return this.http.get<Notification[]>(this.apiUrl);
  }

  markAsRead(id: string) {
    return this.http.patch(`${this.apiUrl.replace('/me', '')}/${id}/leer`, {}).pipe(
      tap(() => {
        const updated = this.notificationsSubject.value.map(n => 
          n.id === id ? { ...n, leido: true } : n
        );
        this.notificationsSubject.next(updated);
      })
    );
  }

  getUnreadCount() {
    return this.notificationsSubject.value.filter(n => !n.leido).length;
  }
}
