import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { AvgRssi } from './avg-rssi';
import { RssiTime } from './rssi-time';




@Injectable({
  providedIn: 'root'
})
export class DataService {
  private baseUrl = 'http://127.0.0.1:5000'; 
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}


  RSSI_over_time(): Observable<RssiTime[]> {
    return this.http.get<RssiTime[]>(`${this.baseUrl}/RSSI_over_time`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }


  average_RSSI(): Observable<AvgRssi[]> {
    return this.http.get<AvgRssi[]>(`${this.baseUrl}/average_RSSI`)
      .pipe(
        retry(1),
        catchError(this.handleError)
      );
  }

  // Error handling method
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Bad Request - Please check your input';
          break;
        case 401:
          errorMessage = 'Unauthorized - Please check your credentials';
          break;
        case 403:
          errorMessage = 'Forbidden - You do not have permission';
          break;
        case 404:
          errorMessage = 'Not Found - The requested resource was not found';
          break;
        case 500:
          errorMessage = 'Internal Server Error - Please try again later';
          break;
        default:
          errorMessage = `Server Error: ${error.status}\nMessage: ${error.message}`;
      }
    }
    
    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}

