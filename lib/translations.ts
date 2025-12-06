export const translations = {
    en: {
        hero: {
            title: 'ENOUGH',
            tagline: 'Enough to change your life',
            subtext: 'Track your savings, reach your goals, and build wealth one small decision at a time',
        },
        auth: {
            signInTab: 'Sign In',
            signUpTab: 'Sign Up',
            namePlaceholder: 'Name',
            emailPlaceholder: 'Email',
            passwordPlaceholder: 'Password',
            referralPlaceholder: 'Referral Code (optional)',
            signInButton: 'Sign In',
            createAccountButton: 'Create Account',
            loading: 'Loading...',
        },
        features: {
            sayEnough: 'Say Enough',
            buildWealth: 'Build Wealth',
            reachGoals: 'Reach Goals',
        },
    },
    ru: {
        hero: {
            title: 'ENOUGH',
            tagline: 'Достаточно, чтобы изменить жизнь',
            subtext: 'Отслеживайте сбережения, достигайте целей и создавайте капитал, шаг за шагом',
        },
        auth: {
            signInTab: 'Вход',
            signUpTab: 'Регистрация',
            namePlaceholder: 'Имя',
            emailPlaceholder: 'Email',
            passwordPlaceholder: 'Пароль',
            referralPlaceholder: 'Код приглашения (опционально)',
            signInButton: 'Войти',
            createAccountButton: 'Создать аккаунт',
            loading: 'Загрузка...',
        },
        features: {
            sayEnough: 'Скажи Хватит',
            buildWealth: 'Создай капитал',
            reachGoals: 'Достигни целей',
        },
    },
} as const;

export type Language = keyof typeof translations;
