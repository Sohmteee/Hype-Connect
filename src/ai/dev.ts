'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/hypeman-content-suggestions.ts';
import '@/ai/flows/generate-hype-badge.ts';
