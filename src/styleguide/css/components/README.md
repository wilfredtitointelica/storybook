Estructura de Archivos y Estilos de un Componente
		
			html {
				line-height: 1.5;
				font-family: Georgia, serif;
				font-size: 20px;
				color: #1a1a1a;
				background-color: #fdfdfd;
			}
			body {
				margin: 0 auto;
				max-width: 50em;
				padding: 50px;
				hyphens: auto;
				overflow-wrap: break-word;
				text-rendering: optimizeLegibility;
				font-kerning: normal;
			}
			pre code {
				font-family: Menlo, Monaco, "Lucida Console", Consolas, monospace;
				font-size: 85%;
				color: #1a1a1a;
				white-space: pre-wrap;
			}
			.highlight {
				color: blue;
			}
			h1,
			h2,
			h3,
			h4 {
				margin-block: 1em;
			}
			hr {
				background-color: #1a1a1a;
				border: none;
				height: 1px;
				margin: 2em 0;
			}
		
	
	
		# 📁 Estructura de Archivos y Estilos de un Componente


		
			Esta guía explica cómo estructurar, nombrar y organizar los estilos SCSS de un componente, usando convenciones
			BEM
			,
			partials
			, y un prefijo de ejemplo (
			`.gr*`
			) para las clases.
		


		

		## 📂 Estructura de archivos .scss


		```scss
components/
  table/
    _table.scss
    _table.compact.scss
    _table.striped.scss
    _index.scss
```


		
		## 🎨 Estilos Base


		```scss
// _table.scss
.grTable {
  width: 100%;
  border-collapse: collapse;

  &__head {
    font-weight: bold;
    background: $color-gray-light;
  }

  &__row {
    border-bottom: 1px solid $color-border;
  }

  &__cell {
    padding: 0.75rem 1rem;
    text-align: left;
  }
}
```


		
		## 🎨 Estilos Variantes



		### 👉 Variante Compacta


		```scss
// _table.compact.scss
@use './table';

.grTable {
	&--compact {
    &__cell {
      padding: 0.25rem 0.5rem;
    }
  }
}
```


		### 👉 Variante Striped


		```scss
// _table.striped.scss
@use './table';

.grTable {
	&--striped {
    &__row:nth-child(even) {
      background-color: $color-gray-lighter;
    }
  }
}
```


		
		## 📄 Ejemplo HTML


		```scss
&lt;table class="grTable grTable--compact grTable--striped"&gt;
  &lt;thead class="grTable__head"&gt;
    &lt;tr class="grTable__row"&gt;
      &lt;th class="grTable__cell"&gt;Nombre&lt;/th&gt;
      &lt;th class="grTable__cell"&gt;Edad&lt;/th&gt;
    &lt;/tr&gt;
  &lt;/thead&gt;
  &lt;tbody&gt;
    &lt;tr class="grTable__row"&gt;
      &lt;td class="grTable__cell"&gt;Ana&lt;/td&gt;
      &lt;td class="grTable__cell"&gt;25&lt;/td&gt;
    &lt;/tr&gt;
  &lt;/tbody&gt;
&lt;/table&gt;
```


		
		## 📦 Index del Componente


		```scss
// _index.scss
@forward './table';
@forward './table.compact';
@forward './table.striped';
```


		
		## 
			📥 Importación en
			`main.scss`
		


		
			En el archivo
			`main.scss`
			centralizas los estilos importando los entry points de cada componente:
		


		```scss
// main.scss
@use 'components/table';
@use 'components/button';
@use 'components/modal';
...
```


		
		## 
			📌 Diferencia entre
			`@use`
			y
			`@forward`
		


		
			- 
				@use
				: Se utiliza para
				importar
				un archivo SCSS dentro de otro. Encapsula en un namespace y se usa directamente.
			

			- 
				@forward
				: Se utiliza para
				re-exportar
				varios archivos SCSS desde un punto de entrada (ej. un index). Sirve para organizar y centralizar imports.
			

		



		
		## 
			📘 ¿Por qué usar un
			`_index.scss`
			?
		


		
			El archivo
			`_index.scss`
			actúa como
			punto de entrada
			para cada componente. Esto te permite:
		


		
			- 
				Importar el componente con un solo
				`@use`
				, en lugar de múltiples líneas.
			

			- 
				Agregar nuevas variantes sin modificar el
				`main.scss`
				.
			

			- Mantener la arquitectura más limpia y escalable a medida que crecen los componentes.