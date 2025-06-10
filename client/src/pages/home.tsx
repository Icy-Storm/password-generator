import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Shield, Copy, RefreshCw, Info, CheckCircle, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PasswordOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface StrengthAnalysis {
  score: number;
  level: string;
  color: string;
  lengthCheck: boolean;
  mixCheck: boolean;
}

const characters = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

export default function Home() {
  const [passwordLength, setPasswordLength] = useState(12);
  const [options, setOptions] = useState<PasswordOptions>({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false
  });
  const [autoGenerate, setAutoGenerate] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("Click generate to create password");
  const [strengthAnalysis, setStrengthAnalysis] = useState<StrengthAnalysis>({
    score: 0,
    level: "Generate password to check",
    color: "bg-gray-300",
    lengthCheck: false,
    mixCheck: false
  });

  const { toast } = useToast();

  const generateSecurePassword = useCallback(() => {
    const activeCharSets = Object.keys(options)
      .filter(key => options[key as keyof PasswordOptions])
      .map(key => characters[key as keyof typeof characters]);

    if (activeCharSets.length === 0) {
      setGeneratedPassword('Please select at least one character type');
      return '';
    }

    let charset = activeCharSets.join('');
    let password = '';

    // Ensure at least one character from each selected type
    activeCharSets.forEach(set => {
      const randomBytes = new Uint8Array(1);
      crypto.getRandomValues(randomBytes);
      password += set.charAt(randomBytes[0] % set.length);
    });

    // Fill remaining length with random characters
    for (let i = password.length; i < passwordLength; i++) {
      const randomBytes = new Uint8Array(1);
      crypto.getRandomValues(randomBytes);
      password += charset.charAt(randomBytes[0] % charset.length);
    }

    // Shuffle the password using Fisher-Yates algorithm
    const passwordArray = password.split('');
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const randomBytes = new Uint8Array(1);
      crypto.getRandomValues(randomBytes);
      const j = randomBytes[0] % (i + 1);
      [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
    }
    
    const finalPassword = passwordArray.join('');
    setGeneratedPassword(finalPassword);
    return finalPassword;
  }, [passwordLength, options]);

  const analyzePasswordStrength = useCallback((password: string) => {
    if (!password || password === 'Click generate to create password' || password === 'Please select at least one character type') {
      setStrengthAnalysis({
        score: 0,
        level: "Generate password to check",
        color: "bg-gray-300",
        lengthCheck: false,
        mixCheck: false
      });
      return;
    }

    let score = 0;

    // Length check
    const lengthGood = password.length >= 12;
    if (lengthGood) score += 25;

    // Character type diversity
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
    
    const typeCount = [hasUpper, hasLower, hasNumbers, hasSymbols].filter(Boolean).length;
    const mixGood = typeCount >= 3;
    if (mixGood) score += 25;

    // Additional scoring
    if (password.length >= 16) score += 25;
    if (typeCount === 4) score += 25;

    // Determine strength level and color
    let level: string, color: string;
    if (score < 25) {
      level = 'Weak';
      color = 'bg-red-500';
    } else if (score < 50) {
      level = 'Fair';
      color = 'bg-yellow-500';
    } else if (score < 75) {
      level = 'Good';
      color = 'bg-blue-500';
    } else {
      level = 'Strong';
      color = 'bg-green-500';
    }

    setStrengthAnalysis({
      score,
      level,
      color,
      lengthCheck: lengthGood,
      mixCheck: mixGood
    });
  }, []);

  const copyToClipboard = async () => {
    if (generatedPassword && generatedPassword !== 'Click generate to create password' && generatedPassword !== 'Please select at least one character type') {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        toast({
          title: "Password copied!",
          description: "Password has been copied to your clipboard.",
        });
      } catch (err) {
        toast({
          title: "Copy failed",
          description: "Unable to copy password to clipboard.",
          variant: "destructive"
        });
      }
    }
  };

  const updateOption = (key: keyof PasswordOptions, checked: boolean) => {
    setOptions(prev => ({ ...prev, [key]: checked }));
  };

  // Auto-generate when settings change
  useEffect(() => {
    if (autoGenerate) {
      generateSecurePassword();
    }
  }, [autoGenerate, passwordLength, options, generateSecurePassword]);

  // Analyze strength when password changes
  useEffect(() => {
    analyzePasswordStrength(generatedPassword);
  }, [generatedPassword, analyzePasswordStrength]);

  // Calculate slider progress for custom styling
  const sliderProgress = ((passwordLength - 4) / (50 - 4)) * 100;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--gray-50)' }}>
      <div className="max-w-md mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: 'var(--primary-600)' }}>
            <Shield className="text-white text-2xl" size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--gray-900)' }}>SecurePass</h1>
          <p style={{ color: 'var(--gray-600)' }}>Generate strong, secure passwords</p>
        </div>

        {/* Password Generator */}
        <Card className="rounded-2xl shadow-lg mb-6">
          <CardContent className="p-6">
            
            {/* Generated Password */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--gray-700)' }}>Generated Password</label>
              <div className="relative">
                <div className="border rounded-lg p-4 pr-12 min-h-[3rem] flex items-center" style={{ backgroundColor: 'var(--gray-50)', borderColor: 'var(--gray-200)' }}>
                  <span className="font-mono text-lg break-all leading-relaxed" style={{ color: 'var(--gray-900)' }}>
                    {generatedPassword}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:text-blue-600 transition-colors duration-200"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" style={{ color: 'var(--gray-400)' }} />
                </Button>
              </div>
            </div>

            {/* Password Length */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium" style={{ color: 'var(--gray-700)' }}>Password Length</label>
                <span className="text-sm font-semibold px-2 py-1 rounded" style={{ color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)' }}>
                  {passwordLength}
                </span>
              </div>
              <div className="relative">
                <Slider
                  value={[passwordLength]}
                  onValueChange={(value) => setPasswordLength(value[0])}
                  min={4}
                  max={50}
                  step={1}
                  className="password-slider"
                  style={{ '--progress': `${sliderProgress}%` } as React.CSSProperties}
                />
                <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--gray-500)' }}>
                  <span>4</span>
                  <span>50</span>
                </div>
              </div>
            </div>

            {/* Password Options */}
            <div className="mb-8">
              <label className="block text-sm font-medium mb-4" style={{ color: 'var(--gray-700)' }}>Character Types</label>
              <div className="space-y-3">
                
                <label className="flex items-center cursor-pointer group">
                  <Checkbox
                    checked={options.uppercase}
                    onCheckedChange={(checked) => updateOption('uppercase', !!checked)}
                    className="w-5 h-5"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium group-hover:text-blue-600 transition-colors" style={{ color: 'var(--gray-900)' }}>Capital Letters</span>
                    <div className="text-xs font-mono" style={{ color: 'var(--gray-500)' }}>A-Z</div>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer group">
                  <Checkbox
                    checked={options.lowercase}
                    onCheckedChange={(checked) => updateOption('lowercase', !!checked)}
                    className="w-5 h-5"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium group-hover:text-blue-600 transition-colors" style={{ color: 'var(--gray-900)' }}>Lowercase Letters</span>
                    <div className="text-xs font-mono" style={{ color: 'var(--gray-500)' }}>a-z</div>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer group">
                  <Checkbox
                    checked={options.numbers}
                    onCheckedChange={(checked) => updateOption('numbers', !!checked)}
                    className="w-5 h-5"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium group-hover:text-blue-600 transition-colors" style={{ color: 'var(--gray-900)' }}>Numbers</span>
                    <div className="text-xs font-mono" style={{ color: 'var(--gray-500)' }}>0-9</div>
                  </div>
                </label>

                <label className="flex items-center cursor-pointer group">
                  <Checkbox
                    checked={options.symbols}
                    onCheckedChange={(checked) => updateOption('symbols', !!checked)}
                    className="w-5 h-5"
                  />
                  <div className="ml-3 flex-1">
                    <span className="text-sm font-medium group-hover:text-blue-600 transition-colors" style={{ color: 'var(--gray-900)' }}>Special Characters</span>
                    <div className="text-xs font-mono" style={{ color: 'var(--gray-500)' }}>!@#$%^&*</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Generate Actions */}
            <div className="space-y-3">
              <Button 
                onClick={generateSecurePassword}
                className="w-full font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                style={{ backgroundColor: 'var(--primary-600)', color: 'white' }}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Generate New Password</span>
              </Button>

              <label className="flex items-center justify-center cursor-pointer group">
                <Checkbox
                  checked={autoGenerate}
                  onCheckedChange={(checked) => setAutoGenerate(!!checked)}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm group-hover:text-blue-600 transition-colors" style={{ color: 'var(--gray-600)' }}>
                  Auto-generate on settings change
                </span>
              </label>
            </div>

          </CardContent>
        </Card>

        {/* Password Strength */}
        <Card className="rounded-2xl shadow-lg mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-900)' }}>Password Strength</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--gray-600)' }}>Strength Level</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--gray-500)' }}>{strengthAnalysis.level}</span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--gray-200)' }}>
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${strengthAnalysis.color}`}
                  style={{ width: `${strengthAnalysis.score}%` }}
                />
              </div>
              <div className="text-xs space-y-1" style={{ color: 'var(--gray-500)' }}>
                <div className="flex items-center space-x-2">
                  {strengthAnalysis.lengthCheck ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4" style={{ color: 'var(--gray-300)' }} />
                  )}
                  <span>At least 12 characters</span>
                </div>
                <div className="flex items-center space-x-2">
                  {strengthAnalysis.mixCheck ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className="w-4 h-4" style={{ color: 'var(--gray-300)' }} />
                  )}
                  <span>Mix of character types</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <div className="border rounded-2xl p-6" style={{ backgroundColor: 'var(--blue-50)', borderColor: 'var(--blue-200)' }}>
          <div className="flex items-start space-x-3">
            <Info className="mt-1" style={{ color: 'var(--blue-600)' }} size={20} />
            <div>
              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--blue-900)' }}>Security Tips</h4>
              <ul className="text-sm space-y-1" style={{ color: 'var(--blue-800)' }}>
                <li>• Use unique passwords for each account</li>
                <li>• Consider using a password manager</li>
                <li>• Enable two-factor authentication when available</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
