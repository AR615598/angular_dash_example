import { AvgRssi } from "../avg-rssi";
import { RssiTime } from "../rssi-time";
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnInit,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import * as echarts from "echarts";

@Component({
  selector: "app-viz-container",
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
  ],
  template: `
    <mat-card class="chart-card" *ngIf="userData && userData.length > 0">
      <mat-card-header *ngIf="isRssiTime(userData[0]); else avgRssiBlock">
        <mat-card-title>RSSI Over Time</mat-card-title>
      </mat-card-header>
      <ng-template #avgRssiBlock>
        <mat-card-header>
          <mat-card-title>Average RSSI</mat-card-title>

            
          <div style="margin-left: auto; display: flex; gap: 10px;">
            <mat-button-toggle [checked]="plaVisible" (change)="togglePlaceholders()">
              Show Placeholders
            </mat-button-toggle>
            <mat-button-toggle [checked]="pasVisible" (change)="togglePassive()">
              Show Passive
            </mat-button-toggle>

            <mat-button-toggle [checked]="actVisible" (change)="toggleDeactivated()">
              Show Deactivated
            </mat-button-toggle>


          </div>
        </mat-card-header>
      </ng-template>
      <mat-card-content>
        <div #chartContainer class="chart-container"></div>
      </mat-card-content>
      <mat-card-actions align="end">
        <button mat-button (click)="refreshChart()">REFRESH</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [
    `
    .chart-card {
      max-width: 100%;
      box-sizing: border-box;
      margin: 20px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .chart-container {
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
    mat-card-header {
      margin-bottom: 16px;
    }
    mat-card-content {
      padding: 16px 0;
    }
    mat-card-actions {
      padding: 8px 16px 16px 16px;
    }
  `,
  ],
})
export class VizContainerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild("chartContainer", { static: false }) chartContainer!: ElementRef;
  @ViewChild("toggleButton", { static: false }) toggleButton!: ElementRef;
  @Input() userData: (AvgRssi | RssiTime)[] = [];
  @Input() options: any;
  actVisible: boolean = true;
  plaVisible: boolean = true;
  pasVisible: boolean = true;

  private chartInstance: echarts.ECharts | null = null;
  private resizeHandler: () => void;

  constructor() {
    this.resizeHandler = () => {
      if (this.chartInstance) {
        this.chartInstance.resize();
      }
    };
  }

  togglePlaceholders(): void {
    this.plaVisible = !this.plaVisible;
    this.refreshChart();
  }

  toggleDeactivated(): void {
    this.actVisible = !this.actVisible;
    this.refreshChart();
  }

  togglePassive(): void {
    this.pasVisible = !this.pasVisible;
    this.refreshChart();
  }


  isRssiTime(item: any): item is RssiTime {
    return item && "datetime" in item;
  }

  groupByTagId(rssiData: RssiTime[]): Map<string, RssiTime[]> {
    const groupedData = new Map<string, RssiTime[]>();

    for (const item of rssiData) {
      if (!groupedData.has(item.tag_id)) {
        groupedData.set(item.tag_id, []);
      }
      groupedData.get(item.tag_id)!.push(item);
    }

    return groupedData;
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    if (this.userData?.length) {
      this.initializeChart();
      this.chartInstance?.resize();
    }
  }

  private initializeChart(): void {
    if (!this.chartContainer?.nativeElement || !this.userData?.length) {
      return;
    }

    this.chartInstance = echarts.init(this.chartContainer.nativeElement);

    this.generateChartOptions();

    if (this.options) {
      this.chartInstance.setOption(this.options);
    }

    window.addEventListener("resize", this.resizeHandler);
  }

  private generateChartOptions(): void {
    if (!this.userData?.length) return;

    if (this.isRssiTime(this.userData[0])) {
      const rssiData = this.userData as RssiTime[];
      const Rssimap = this.groupByTagId(rssiData);
      var longest = -1;
      var longestTag = this.userData[0].tag_id;
      var seriesData: any[] = [];

      for (const [tagId, rssiArray] of Rssimap) {
        if (rssiArray.length > longest) {
          longest = rssiArray.length;
          longestTag = tagId;
        }
      }
      for (const [tagId, rssiArray] of Rssimap) {
        seriesData.push({
          name: rssiArray[0].assigned_to,
          type: "line",
          data: rssiArray.map((d) => d.avg_rssi),
        });
      }

      const long = Rssimap.get(longestTag)!;

      this.options = {
        tooltip: {
          trigger: "axis",
          formatter: "{b}: {c} dBm",
        },
        xAxis: {
          type: "category",
          // data: long.map(d => d.avg_rssi)
          data: long.map((d) => {
            const dt = new Date(d.datetime);
            const date = dt.toISOString().split("T")[0];
            const time = dt.toTimeString().slice(0, 5);
            return `${date} ${time}`;
          }),
        },
        yAxis: {
          type: "value",
          name: "RSSI (dBm)",
        },
        series: seriesData,
        legend: {
          bottom: 8,
          type: "scroll",
          selectedMode: "multiple",
        },
      };
    } else {
      const newSelected: Record<string, boolean> = {};
      var i = 0;
      var names: string[] = [];
      var seriesData: any[] = [];
      const avgRissi = this.userData as AvgRssi[];
      for (const item of avgRissi) {
        names.push(item.tag_id);
        const arr: any[] = new Array(10).fill(null);
        arr[i] = item.avg_rssi;
        i++;

        let isVisible = true;

        if (item.tag_type === "Placeholder" && !this.plaVisible) {
          isVisible = false;
        }

        if (item.active === 0 && !this.actVisible) {
          isVisible = false;
        }

        if (
          item.tag_type !== "Placeholder" &&
          item.active !== 0 &&
          !this.pasVisible
        ) {
          isVisible = false;
        }

        newSelected[item.tag_id] = isVisible;

        seriesData.push({
          name: item.tag_id,
          type: "bar",
          stack: "total",
          label: {
            show: true,
          },
          emphasis: {
            focus: "series",
          },
          data: arr,
        });
      }

      this.options = {
        legend: {
          top: "top",
          selected: newSelected,
        },
        tooltip: {
          trigger: "axis",
          formatter: "{b}: {c} dBm",
        },

        grid: {
          left: "3%",
          right: "4%",
          bottom: "3%",
          containLabel: true,
        },
        xAxis: {
          type: "category",
          data: names,
          axisLabel: { interval: 0, rotate: 30 },
        },
        yAxis: {
          type: "value",
          name: "Avg RSSI (dBm)",
        },
        series: seriesData,
      };
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["userData"] && this.userData?.length) {
      // Delay until DOM update cycle finishes
      setTimeout(() => {
        if (!this.chartInstance && this.chartContainer?.nativeElement) {
          this.initializeChart();
        } else if (this.chartInstance) {
          this.generateChartOptions();
          this.chartInstance.setOption(this.options, true);
          this.chartInstance.resize();
        }
      });
    }
  }

  ngOnDestroy(): void {
    // Clean up chart instance
    if (this.chartInstance) {
      this.chartInstance.dispose();
      this.chartInstance = null;
    }
    window.removeEventListener("resize", this.resizeHandler);
  }

  refreshChart(): void {
    if (this.chartInstance) {
      this.chartInstance.clear();
      this.generateChartOptions();
      if (this.options) {
        this.chartInstance.setOption(this.options, true);
      }
      setTimeout(() => {
        if (this.chartInstance) {
          this.chartInstance.resize();
        }
      }, 100);
    }
  }
}
