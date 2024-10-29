"use client";

import { MutableRefObject, ReactElement, useEffect, useId, useRef, useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { MermaidConfig } from 'mermaid';
import type { PluginOptions } from "./"

type MermaidProps = {
  chart: string;
} & PluginOptions;

function useIsVisible(ref: MutableRefObject<HTMLElement>) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        setIsIntersecting(true);
      }
    });

    observer.observe(ref.current);
    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isIntersecting;
}

export function Mermaid({ chart, className, theme }: MermaidProps): ReactElement {
  const id = useId();
  const [svg, setSvg] = useState('');
  const containerRef = useRef<HTMLDivElement>(null!);
  const isVisible = useIsVisible(containerRef);

  useEffect(() => {
    if (!isVisible) return;

    const htmlElement = document.documentElement;
    const observer = new MutationObserver(renderChart);
    observer.observe(htmlElement, { attributes: true });
    renderChart();

    return () => {
      observer.disconnect();
    };
  }, [chart, isVisible]);

  const memoizedClassName = useMemo(() => clsx("mermaid", className), [className]);

  async function renderChart() {
    const htmlElement = document.documentElement;
    const isDarkTheme =
      htmlElement.classList.contains('dark') ||
      htmlElement.attributes.getNamedItem('data-theme')?.value === 'dark';
    const mermaidConfig: MermaidConfig = {
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: 'inherit',
      themeCSS: 'margin: 1.5rem auto 0;',
      theme: isDarkTheme ? (theme?.dark ? 'base' : 'dark') : (theme?.light ? 'base' : 'default'),
      themeVariables: isDarkTheme ? theme?.dark?.themeVariables : theme?.light?.themeVariables,
    };

    const { default: mermaid } = await import('mermaid');

    try {
      mermaid.initialize(mermaidConfig);
      const { svg } = await mermaid.render(
        id.replaceAll(':', ''),
        chart.replaceAll('\\n', '\n'),
        containerRef.current,
      );
      setSvg(svg);
    } catch (error) {
      // eslint-disable-next-line no-console -- show error
      console.error('Error while rendering mermaid', error);
    }
  }

  return (
    <div className={memoizedClassName} ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} />
  );
};
