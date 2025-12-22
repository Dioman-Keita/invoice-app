import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '../../components/global/Header';
import { BrowserRouter } from 'react-router-dom';

describe('Header Component', () => {
    it('renders the application title', () => {
        render(
            <BrowserRouter>
                <Header />
            </BrowserRouter>
        );
        // On s'attend à trouver CMDT dans le header
        expect(screen.getByText(/C\.M\.D\.T/i)).toBeInTheDocument();
    });
});
