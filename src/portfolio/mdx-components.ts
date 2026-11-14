// Blocks the project and devlog .mdx bodies use without importing them: <Content components={mdxComponents} />
import Section from '../components/portfolio/article/Section.astro';
import Figure from '../components/portfolio/article/Figure.astro';
import Grid from '../components/portfolio/article/Grid.astro';
import Stats from '../components/portfolio/article/Stats.astro';
import Block from '../components/portfolio/article/Block.astro';
import YouTube from '../components/portfolio/YouTubeEmbed.astro';
import Compare from '../components/portfolio/CompareView.astro';
import Flipbook from '../components/portfolio/Flipbook.astro';
import PresetCards from '../components/portfolio/PresetCards.astro';

export const mdxComponents = { Section, Figure, Grid, Stats, Block, YouTube, Compare, Flipbook, PresetCards };
