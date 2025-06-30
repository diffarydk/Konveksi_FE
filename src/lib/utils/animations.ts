// src/lib/utils/animations.ts
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/**
 * Animates a counter from 0 to a target value
 * 
 * @param element - The DOM element to update
 * @param target - The target number to count to
 * @param unit - The unit to append (e.g. '+', '%', 'M+')
 * @param duration - Animation duration in ms
 */
export function animateCounter(element: Element, target: number, unit: string = '', duration: number = 2000): void {
  let start = 0;
  const step = target / (duration / 16); // 60 FPS
  
  function updateCounter() {
    start += step;
    if (start < target) {
      element.textContent = Math.floor(start) + unit;
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = target + unit;
    }
  }
  
  updateCounter();
}

/**
 * Sets up an intersection observer to trigger animations when elements are visible
 * 
 * @param elementSelector - CSS selector for target elements
 * @param animationClass - CSS class to add when element is visible
 * @param threshold - Visibility threshold (0-1)
 */
export function setupScrollAnimations(
  elementSelector: string, 
  animationClass: string = 'animate',
  threshold: number = 0.2
): void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add(animationClass);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold });

  document.querySelectorAll(elementSelector).forEach(element => {
    observer.observe(element);
  });
}

/**
 * Enhanced fade in transition with optional y-axis movement
 */
export function fadeIn(
  node: Element, 
  {
    delay = 0,
    duration = 400,
    easing = cubicOut,
    y = 0
  }: {
    delay?: number;
    duration?: number;
    easing?: (t: number) => number;
    y?: number;
  } = {}
): TransitionConfig {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const transform = style.transform === 'none' ? '' : style.transform;
  
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `
      opacity: ${t * opacity};
      transform: ${transform} translateY(${(1 - t) * y}px);
    `
  };
}

/**
 * Fade out transition with optional y-axis movement
 */
export function fadeOut(
  node: Element, 
  {
    delay = 0,
    duration = 300,
    easing = cubicOut,
    y = 0
  }: {
    delay?: number;
    duration?: number;
    easing?: (t: number) => number;
    y?: number;
  } = {}
): TransitionConfig {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const transform = style.transform === 'none' ? '' : style.transform;
  
  return {
    delay,
    duration,
    easing,
    css: (t, u) => `
      opacity: ${t * opacity};
      transform: ${transform} translateY(${u * y}px);
    `
  };
}

/**
 * Slide down transition
 */
export function slideDown(
  node: Element,
  {
    delay = 0,
    duration = 400,
    easing = cubicOut
  }: {
    delay?: number;
    duration?: number;
    easing?: (t: number) => number;
  } = {}
): TransitionConfig {
  const style = getComputedStyle(node);
  const height = parseFloat(style.height);
  const padding_top = parseFloat(style.paddingTop);
  const padding_bottom = parseFloat(style.paddingBottom);
  const margin_top = parseFloat(style.marginTop);
  const margin_bottom = parseFloat(style.marginBottom);
  
  return {
    delay,
    duration,
    easing,
    css: t => `
      overflow: hidden;
      height: ${t * height}px;
      padding-top: ${t * padding_top}px;
      padding-bottom: ${t * padding_bottom}px;
      margin-top: ${t * margin_top}px;
      margin-bottom: ${t * margin_bottom}px;
    `
  };
}

/**
 * Shake animation for form validation errors
 */
export function shake(
  node: Element,
  {
    delay = 0,
    duration = 600,
    intensity = 5
  }: {
    delay?: number;
    duration?: number;
    intensity?: number;
  } = {}
): TransitionConfig {
  const transform = getComputedStyle(node).transform.replace('none', '');
  
  return {
    delay,
    duration,
    css: t => {
      const offset = Math.sin(t * 10) * intensity * (1 - t);
      return `transform: ${transform} translateX(${offset}px);`;
    }
  };
}