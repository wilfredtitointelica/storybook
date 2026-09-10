import { Directive, ElementRef, Input, OnChanges, Renderer2 } from "@angular/core";

@Directive({
	selector: "[itlHighlight]",
	standalone: true,
})
export class HighlightDirective implements OnChanges {
	@Input("highlight") query = "";
	@Input() text = "";

	constructor(private el: ElementRef<HTMLElement>, private r: Renderer2) {}

	ngOnChanges(): void {
		this.render();
	}

	private render() {
		const host = this.el.nativeElement;

		// limpia el contenido previo
		while (host.firstChild) host.removeChild(host.firstChild);

		const t = this.text ?? "";
		const q = (this.query ?? "").trim();

		if (!t || !q) {
			host.appendChild(document.createTextNode(t));
			return;
		}

		// Escapar query para usarlo como literal en RegExp
		const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const re = new RegExp(escaped, "gi");

		let last = 0;
		for (const m of t.matchAll(re)) {
			const start = m.index ?? 0;
			const end = start + m[0].length;

			// texto normal antes del match
			if (start > last) {
				host.appendChild(document.createTextNode(t.slice(last, start)));
			}

			// SOLO el match subrayado
			const span = this.r.createElement("span");
			this.r.addClass(span, "ptSearchResult__nameline");
			span.appendChild(document.createTextNode(t.slice(start, end)));
			host.appendChild(span);

			last = end;
		}

		// texto normal después del último match
		if (last < t.length) {
			host.appendChild(document.createTextNode(t.slice(last)));
		}
	}
}
