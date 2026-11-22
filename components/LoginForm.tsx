'use client'

// components/LoginForm.tsx — real staff login (server verifies credentials + membership).
import { useState } from 'react'
import { Box, Button, Card, CardContent, CardHeader, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { AccountCircle, Lock, Login as LoginIcon, Visibility, VisibilityOff } from '@mui/icons-material'
import { emitToast } from '@/lib/toast'

interface Props {
  restaurantName?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid: 'ইমেইল বা ফোন বা পাসওয়ার্ড ভুল।',
  inactive: 'আপনার অ্যাকাউন্ট নিষ্ক্রিয়।',
  denied: 'আপনার স্টাফ হিস্টরি নেই।',
  server_error: 'সার্ভার সমস্যা। পরে পুনরায় চেষ্টা করুন।',
  not_found: 'অ্যাকাউন্ট পাওয়া যায়নি।',
}

export default function LoginForm({ restaurantName = 'NOA Cafe' }: Props) {
  const [phoneOrEmail, setPhoneOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneOrEmail, password }),
      })
      const data = await res.json()
      if (!data.ok) {
        emitToast(ERROR_MESSAGES[data.code ?? 'server_error'] ?? 'লগইন ব্যর্থ হয়েছে।', 'error')
        return
      }
      window.location.assign('/admin')
    } catch {
      emitToast('সার্ভার সমস্যা। পরে পুনরায় চেষ্টা করুন।', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: { xs: '100%', sm: 420 }, px: { xs: 2, sm: 0 } }}>
      <Card sx={{ width: '100%' }}>
        <CardHeader
          title={<Typography variant="h6" sx={{ fontWeight: 700 }}>{restaurantName} — অ্যাডমিন লগইন</Typography>}
          subheader={<Typography variant="body2" color="text.secondary">আসল স্টাফ হিস্টরি ব্যবহার করে লগইন করুন</Typography>}
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: { xs: 2, sm: 2.5 } }}>
          <TextField
            label="ফোন বা ইমেইল"
            value={phoneOrEmail}
            onChange={(e) => setPhoneOrEmail(e.target.value)}
            required
            autoFocus={isMobile}
            variant="outlined"
            size="medium"
            helperText="ফোন নম্বর বা ইমেইল দিন"
            slotProps={{ htmlInput: { autoCapitalize: 'none' } }}
            sx={{ '& input': { fontSize: '0.95rem' } }}
          />
          <TextField
            label="পাসওয়ার্ড"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            size="medium"
            slotProps={{
              input: {
                endAdornment: (
                  <Box sx={{ cursor: 'pointer' }} onClick={() => setShowPassword((v) => !v)} aria-label="পাসওয়ার্ড দেখানো/লুকানো">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </Box>
                ),
                autoComplete: 'new-password',
              },
            }}
            sx={{ '& input': { fontSize: '0.95rem' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading}
            sx={{ py: 1.4, fontWeight: 600 }}
            startIcon={<LoginIcon />}
          >
            {isLoading ? 'লগইন হচ্ছে…' : 'লগইন'}
          </Button>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', pt: 0.5 }}>
            <AccountCircle fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              পাসওয়ার্ড ভুল হলে সুপারিশ: নতুন পাসওয়ার্ড সেট করুন (স্টাফ প্যানেলে)।
            </Typography>
          </Box>
          <Lock fontSize="small" color="action" sx={{ display: 'none' }} />
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
            প্রথম বার লগইন? → ‘স্টাফ’ পেজ থেকে নতুন স্টাফ অ্যাকাউন্ট তৈরি করুন।
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
