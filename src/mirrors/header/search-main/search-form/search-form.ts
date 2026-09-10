import { Component, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { ConfigService } from 'intelica-library-base';
import { SearchService } from '../search.service';

@Component({
  selector: 'search-form',
  imports: [FormsModule, InputText, ButtonModule],
  templateUrl: './search-form.html',
})
export class SearchForm {
  public placeholderInput = input<string>('');
  public interaction = output<{ event: Event; target: HTMLElement }>();
  public configService = inject(ConfigService);

  public searchService = inject(SearchService);

  public value = this.searchService.searchText;

  public searchFormPattern = viewChild<ElementRef<HTMLElement>>('searchFormPattern');

  ClearSearch() {
    this.searchService.clearText();
  }

  onChangeSearchText(text: string) {
    this.searchService.updateSearchText(text);
  }

  EmitInteraction(event: Event) {
    const target = this.searchFormPattern()?.nativeElement;
    if (target) this.interaction.emit({ event, target });
  }
}
