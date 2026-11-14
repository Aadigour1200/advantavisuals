import porscheThumb from '../assets/images/portfolio_porsche_film_1794666378620.jpg';
import rolexThumb from '../assets/images/portfolio_rolex_film_1794666379014.jpg';
import kimiricaThumb from '../assets/images/portfolio_kimirica_film_1794666379039.jpg';
import roadsterThumb from '../assets/images/portfolio_roadster_film_1794666380346.jpg';
import posterObsidianImg from '../assets/images/poster_obsidian_fragrance_1794671985889.jpg';
import posterChronographImg from '../assets/images/poster_chronograph_campaign_1794671985841.jpg';
import visualBotanicalImg from '../assets/images/visual_botanical_serum_1794671985188.jpg';
import visualAudioImg from '../assets/images/visual_artisan_audio_1794671985577.jpg';

export type VideoAspectRatio = '16:9' | '9:16';
export type VisualType = 'Brand Poster' | 'Product Visual';
export type VisualAspectRatio = '3:4' | '1:1' | '4:3';

export const DEFAULT_PORTFOLIO_CATEGORIES: string[] = [
  'Automotive',
  'Luxury Watches',
  'Luxury Timepieces',
  'Luxury Fragrance',
  'Skincare & Beauty',
  'Beauty and Personal Care',
  'Fashion',
  'Consumer Tech',
];

export interface PortfolioFilm {
  id: string;
  indexNumber: string;
  title: string;
  category: string;
  aspectRatio: VideoAspectRatio;
  duration: string;
  /**
   * Editable MP4 video path.
   * Place your .mp4 files inside /public/videos/ and update the path below,
   * for example: "/videos/porsche-concept.mp4".
   * Leave as "" to display the editorial placeholder with upload instructions.
   */
  videoSrc: string;
  expectedFilePath: string;
  thumbnailSrc: string;
  thumbnailAlt: string;
  conceptNote: string;
  specLabel: string;
}

export interface PortfolioVisualItem {
  id: string;
  indexNumber: string;
  title: string;
  category: string;
  visualType: VisualType;
  aspectRatio: VisualAspectRatio;
  imageSrc: string;
  imageAlt: string;
  conceptNote: string;
}

/**
 * Central Portfolio Video Configuration
 * -------------------------------------
 * Edit `videoSrc`, `aspectRatio`, `duration`, or `thumbnailSrc` in this single file
 * to update the films showcased across the AdvantaVisuals portfolio.
 */
export const PORTFOLIO_FILMS: PortfolioFilm[] = [
  {
    id: 'porsche-concept',
    indexNumber: '01',
    title: 'Porsche Concept Film',
    category: 'Automotive',
    aspectRatio: '16:9',
    duration: '0:24',
    videoSrc: '', // Example when uploaded: '/videos/porsche-concept.mp4'
    expectedFilePath: 'public/videos/porsche-concept.mp4',
    thumbnailSrc: porscheThumb,
    thumbnailAlt: 'Dark architectural tunnel frame of a monochrome performance coupe for Porsche Concept Film',
    conceptNote: 'Architectural light study exploring aerodynamic form, wet asphalt reflections, and nocturnal tension.',
    specLabel: 'Independent Concept Film · Spec Commercial',
  },
  {
    id: 'rolex-concept',
    indexNumber: '02',
    title: 'Rolex Concept Film',
    category: 'Luxury Watches',
    aspectRatio: '9:16',
    duration: '0:18',
    videoSrc: '', // Example when uploaded: '/videos/rolex-concept.mp4'
    expectedFilePath: 'public/videos/rolex-concept.mp4',
    thumbnailSrc: rolexThumb,
    thumbnailAlt: 'Vertical macro frame of a brushed steel mechanical timepiece on dark slate for Rolex Concept Film',
    conceptNote: 'Vertical macro horology sequence focused on brushed steel, sapphire reflections, and chiaroscuro depth.',
    specLabel: 'Independent Concept Film · Spec Commercial',
  },
  {
    id: 'kimirica-product',
    indexNumber: '03',
    title: 'Kimirica Product Film',
    category: 'Beauty and Personal Care',
    aspectRatio: '9:16',
    duration: '0:20',
    videoSrc: '', // Example when uploaded: '/videos/kimirica-product.mp4'
    expectedFilePath: 'public/videos/kimirica-product.mp4',
    thumbnailSrc: kimiricaThumb,
    thumbnailAlt: 'Vertical luxury skincare glass dropper bottle on dark basalt stone for Kimirica Product Film',
    conceptNote: 'Tactile botanical skincare study balancing frosted glass, mist droplets, and calm silver rim lighting.',
    specLabel: 'Independent Concept Film · Spec Commercial',
  },
  {
    id: 'roadster-fashion',
    indexNumber: '04',
    title: 'Roadster Fashion Film',
    category: 'Fashion',
    aspectRatio: '16:9',
    duration: '0:28',
    videoSrc: '', // Example when uploaded: '/videos/roadster-fashion.mp4'
    expectedFilePath: 'public/videos/roadster-fashion.mp4',
    thumbnailSrc: roadsterThumb,
    thumbnailAlt: 'High-contrast monochrome editorial fashion still in a concrete gallery for Roadster Fashion Film',
    conceptNote: 'High-contrast monochrome motion study highlighting tailored silhouette movement across brutalist light.',
    specLabel: 'Independent Concept Film · Spec Commercial',
  },
];

export const PORTFOLIO_VISUALS: PortfolioVisualItem[] = [
  {
    id: 'obsidian-fragrance-poster',
    indexNumber: '01',
    title: 'Obsidian Extrait Key Visual',
    category: 'Luxury Fragrance',
    visualType: 'Brand Poster',
    aspectRatio: '3:4',
    imageSrc: posterObsidianImg,
    imageAlt: 'Matte obsidian glass fragrance bottle resting on wet volcanic basalt rock with silver rim lighting',
    conceptNote: 'High-contrast editorial campaign poster composed around monolithic glass, mist, and wet volcanic texture.',
  },
  {
    id: 'chronograph-concrete-poster',
    indexNumber: '02',
    title: 'Monolith Chronograph Poster',
    category: 'Luxury Timepieces',
    visualType: 'Brand Poster',
    aspectRatio: '3:4',
    imageSrc: posterChronographImg,
    imageAlt: 'Matte black ceramic chronograph watch positioned on fluted architectural concrete with dramatic shadows',
    conceptNote: 'Chiaroscuro print and Instagram-ready key visual highlighting matte ceramic surfaces against brutalist stone.',
  },
  {
    id: 'botanical-serum-visual',
    indexNumber: '03',
    title: 'Amber Botanical Serum Study',
    category: 'Skincare & Beauty',
    visualType: 'Product Visual',
    aspectRatio: '4:3',
    imageSrc: visualBotanicalImg,
    imageAlt: 'Frosted amber skincare serum dropper bottle on dark slate with fine water droplets',
    conceptNote: 'Controlled studio product photography pairing warm amber refraction against cool slate and micro condensation.',
  },
  {
    id: 'artisan-audio-visual',
    indexNumber: '04',
    title: 'Studio Reference Acoustics',
    category: 'Consumer Tech',
    visualType: 'Product Visual',
    aspectRatio: '4:3',
    imageSrc: visualAudioImg,
    imageAlt: 'Brushed aluminum wireless studio headphones resting on honed travertine stone in obsidian lighting',
    conceptNote: 'Sculptural industrial product visual emphasizing precision brushed metal grain and directional silhouette lighting.',
  },
];
