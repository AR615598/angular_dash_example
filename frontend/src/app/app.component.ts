import { Component } from '@angular/core';
import { AvgRssi } from './avg-rssi';
import { RssiTime } from './rssi-time';
import { DataService } from './data.service';
import { VizContainerComponent } from './viz-container/viz-container.component';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [VizContainerComponent, MatToolbarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  avg_rssi: AvgRssi[] = [];
  rssiOverTime: RssiTime[]= [];
  

  constructor(private ApiClient: DataService) { }
  

  ngOnInit() {
    this.ApiClient.RSSI_over_time().subscribe({
      next: (data) => {
        this.rssiOverTime = data;
      },
      error: (error) => {
          console.log(error)
      },
      complete: () => {
          console.log('complete')
      }
    })      
        this.ApiClient.average_RSSI().subscribe({
      next: (data) => {
          this.avg_rssi = data;
      },
      error: (error) => {
          console.log(error)
      },
      complete: () => {
          console.log('complete')
      }
    })    
  }
}
