import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'monatsspecial',
  title: 'Monatsspecial',
  type: 'document',
  fields: [
    defineField({
      name: 'poster',
      title: 'Poster-Bild',
      type: 'image',
      description:
        'Das fertige Monatsspecial-Poster im Hochformat (am besten 1200 × 1600 px, Seitenverhältnis 3:4) – dasselbe Bild wie auf Instagram. Name, Zutaten und Preis stehen direkt auf dem Bild.',
      options: {hotspot: true},
      validation: (Rule) => Rule.required().error('Bitte ein Poster hochladen.'),
    }),
    defineField({
      name: 'altText',
      title: 'Bildbeschreibung (für Google & Screenreader)',
      type: 'string',
      description:
        'Kurz beschreiben, was auf dem Poster steht – Name, Zutaten, Preis. Beispiel: „Blackberry Tonic Matcha mit Brombeere, Tonic, Matcha, Minze und Limette – 7,90 €". Wird nicht sichtbar angezeigt, ist aber wichtig für Suchmaschinen und Barrierefreiheit.',
      validation: (Rule) =>
        Rule.required()
          .min(10)
          .max(300)
          .error('Bitte eine kurze Beschreibung (10–300 Zeichen) eingeben.'),
    }),
    defineField({
      name: 'startDate',
      title: 'Anzeigen ab',
      type: 'date',
      options: {dateFormat: 'DD.MM.YYYY'},
      description: 'Optional. Leer lassen = sofort sichtbar. Sonst erscheint das Poster erst ab diesem Tag.',
    }),
    defineField({
      name: 'endDate',
      title: 'Anzeigen bis',
      type: 'date',
      options: {dateFormat: 'DD.MM.YYYY'},
      description:
        'Optional. Leer lassen = bleibt sichtbar, bis das Poster gelöscht wird. Sonst verschwindet es nach diesem Tag automatisch von der Website.',
      validation: (Rule) =>
        Rule.min(Rule.valueOfField('startDate')).warning('„Anzeigen bis" liegt vor „Anzeigen ab".'),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Kleinere Zahl = weiter vorne im Karussell. Bei gleicher Zahl zählt das Erstelldatum.',
      initialValue: 100,
    }),
  ],
  orderings: [
    {
      title: 'Reihenfolge',
      name: 'sortOrderAsc',
      by: [
        {field: 'sortOrder', direction: 'asc'},
        {field: '_createdAt', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'altText', media: 'poster', start: 'startDate', end: 'endDate'},
    prepare({title, media, start, end}) {
      const fmt = (d) => (d ? d.split('-').reverse().join('.') : null)
      const range = [fmt(start), fmt(end)].filter(Boolean).join(' – ')
      return {
        title: title || 'Monatsspecial',
        subtitle: range ? `Sichtbar: ${range}` : 'Immer sichtbar',
        media,
      }
    },
  },
})
