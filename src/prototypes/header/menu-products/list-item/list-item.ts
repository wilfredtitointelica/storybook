import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from 'primeng/badge';
import { GlobalTermService, TermPipe } from 'intelica-library-base';
@Component({
  selector: 'list-item',
  imports: [CommonModule, RouterLink, TermPipe, Badge],
  templateUrl: './list-item.html',
})
export class ListItemDefault {
  public readonly globalTermService = inject(GlobalTermService);
  icon = input<string>('');
  title = input<string>('');
  description = input<string>('');
  klass = input<string>('');
  route = input<string | null>(null);
  isActive = input<boolean>(false);
  isBeta = input<boolean>(false);
  isLegacy = input<boolean>(false);
  selectItem = output<string | null>();
  activeDemo = signal<boolean>(false);
  private demoData = {
    icon: 'icon-fee-manager',
    title: 'Fee Manager (Demo)',
    description:
      'Manage and analyze payment fees with comprehensive insights and optimization opportunities.',
    klass: 'u-color-product-a',
    route: '/',
  };
  iconDisplay = computed<string>(() =>
    !this.icon() && this.activeDemo() ? this.demoData.icon : this.icon(),
  );
  titleDisplay = computed<string>(() =>
    !this.title() && this.activeDemo() ? this.demoData.title : this.title(),
  );
  descriptionDisplay = computed<string>(() =>
    !this.description() && this.activeDemo() ? this.demoData.description : this.description(),
  );
  klassDisplay = computed<string>(() =>
    !this.klass() && this.activeDemo() ? this.demoData.klass : this.klass(),
  );
  routeDisplay = computed<string | null>(() =>
    !this.route() && this.activeDemo() ? this.demoData.route : this.route(),
  );
  public onSelectItem() {
    this.selectItem.emit(this.routeDisplay());
  }
}
