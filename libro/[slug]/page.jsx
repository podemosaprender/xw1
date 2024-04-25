//INFO: list -> pages
//SEE: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#generating-static-params
import { mk_params } from '@/lib/fetch-data';

const URL='https://docs.google.com/spreadsheets/d/e/2PACX-1vQI2LQ18c9dtIJvrzjLdVztkREkycbkT1LF0DSsOyfXox57sUo2SfLtar2uWJ-vLQ/pub?output=csv'
const getParams= mk_params(URL, {
	delimiter: ',',
	columns: true,
	skip_empty_lines: true,
	slugCols: 'TÍTULO',
});

let d= (await getParams()).filter(r => (r.slug!=''));
export const generateStaticParams= () => d;
export async function generateMetadata({ params }) {
	let este= d.find( r => (r.slug == params.slug) );
  return {
    title: (este ? este['TÍTULO'] : 'Sin Titulo')
  }
}

export default async function Libro({params}) {
	let este= d.find( r => (r.slug == params.slug) );
	return (<div>
		<div>Libro {JSON.stringify(params)} este: {JSON.stringify(este)}</div>
		<ul>
		</ul>
	</div>)
}

