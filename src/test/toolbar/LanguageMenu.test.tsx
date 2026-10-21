import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageMenu } from '../../components/header/LanguageMenu';
import i18n from '../../i18n';

describe('LanguageMenu Component', () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage('en');
  });

  it('renders language trigger button with initial English label', () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId('btn-language-menu');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent(/English/i);
  });

  it('opens language dropdown when clicked and lists English, Français, Deutsch, Dansk', () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId('btn-language-menu');
    fireEvent.click(trigger);

    expect(screen.getByTestId('language-option-en')).toHaveTextContent(/English/i);
    expect(screen.getByTestId('language-option-fr')).toHaveTextContent(/Français/i);
    expect(screen.getByTestId('language-option-de')).toHaveTextContent(/Deutsch/i);
    expect(screen.getByTestId('language-option-da')).toHaveTextContent(/Dansk/i);
  });

  it('changes language to French when Français is clicked', async () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId('btn-language-menu');
    fireEvent.click(trigger);

    const frOption = screen.getByTestId('language-option-fr');
    fireEvent.click(frOption);

    expect(i18n.language).toBe('fr');
    expect(localStorage.getItem('aidboard_language')).toBe('fr');
    expect(trigger).toHaveTextContent(/Français/i);
  });

  it('changes language to German when Deutsch is clicked', async () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId('btn-language-menu');
    fireEvent.click(trigger);

    const deOption = screen.getByTestId('language-option-de');
    fireEvent.click(deOption);

    expect(i18n.language).toBe('de');
    expect(localStorage.getItem('aidboard_language')).toBe('de');
    expect(trigger).toHaveTextContent(/Deutsch/i);
  });

  it('changes language to Danish when Dansk is clicked', async () => {
    render(<LanguageMenu />);
    const trigger = screen.getByTestId('btn-language-menu');
    fireEvent.click(trigger);

    const daOption = screen.getByTestId('language-option-da');
    fireEvent.click(daOption);

    expect(i18n.language).toBe('da');
    expect(localStorage.getItem('aidboard_language')).toBe('da');
    expect(trigger).toHaveTextContent(/Danish/i);
  });
});
