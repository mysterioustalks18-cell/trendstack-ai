import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, DollarSign, Clock, Zap, ArrowRight, TrendingUp } from 'lucide-react';

interface ROICalculatorProps {
  toolName: string;
  monthlyCost: number;
}

export default function ROICalculator({ toolName, monthlyCost }: ROICalculatorProps) {
  const [hoursSaved, setHoursSaved] = useState(10);
  const [hourlyRate, setHourlyRate] = useState(50);

  const monthlySavings = hoursSaved * hourlyRate;
  const netProfit = monthlySavings - monthlyCost;
  const roi = ((netProfit / monthlyCost) * 100).toFixed(0);

  return (
    <div className="bg-card border border-border rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] -mr-16 -mt-16" />
      
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">ROI Calculator</h3>
          <p className="text-sm text-muted-foreground">Estimate your savings with {toolName}</p>
        </div>
      </div>

      <div className="grid gap-8 mb-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Hours saved per month
            </label>
            <span className="text-foreground font-bold">{hoursSaved}h</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={hoursSaved}
            onChange={(e) => setHoursSaved(parseInt(e.target.value))}
            className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Your hourly rate ($)
            </label>
            <span className="text-foreground font-bold">${hourlyRate}/hr</span>
          </div>
          <input
            type="range"
            min="10"
            max="500"
            step="10"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(parseInt(e.target.value))}
            className="w-full h-2 bg-accent rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-accent/50 rounded-2xl p-6 border border-border/50">
          <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Monthly Savings</div>
          <div className="text-3xl font-black text-foreground">${monthlySavings}</div>
        </div>
        <div className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
          <div className="text-xs font-black uppercase tracking-widest text-primary mb-2">Estimated ROI</div>
          <div className="text-3xl font-black text-primary">{roi}%</div>
        </div>
      </div>

      <div className="mt-8 p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex items-center text-sm text-green-500 font-medium">
        <TrendingUp className="w-4 h-4 mr-2" />
        This tool pays for itself in {((monthlyCost / (monthlySavings / 30))).toFixed(1)} days.
      </div>
    </div>
  );
}
