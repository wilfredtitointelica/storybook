import { Injectable, Pipe, PipeTransform } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
@Pipe({
  name: 'size',
})
export class FileSizePipe implements PipeTransform {
  transform(input: number): string {
    const suffixes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let power: number = 0;

    if (input > 0) {
      power = Math.floor(Math.log(input) / Math.log(1024));
    }

    if (input < 1024) {
      if (input === 0) {
        return `${input} B`;
      } else {
        return `${input} ${suffixes[power]}`;
      }
    }
    return `${(input / Math.pow(1024, power)).toFixed(1)} ${suffixes[power]}`;
  }
}
