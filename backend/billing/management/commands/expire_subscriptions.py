"""
Management command: Deneme bitişi -> ACTIVE; süresi dolan abonelikleri EXPIRED yap.
Günlük cron ile çalıştırılabilir.
"""
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from billing.models import Subscription, SubscriptionEvent
from billing.services import _period_days


class Command(BaseCommand):
    help = "Deneme bitenleri ACTIVE yap, süresi dolan abonelikleri EXPIRED yap."

    def handle(self, *args, **options):
        now = timezone.now()
        trial_ended = 0
        expired_count = 0

        # 1) TRIALING + trial_end < now -> ACTIVE, yeni period başlat
        trialing_expired = Subscription.objects.filter(
            status=Subscription.Status.TRIALING,
            trial_end__lt=now,
            trial_end__isnull=False,
        )
        for sub in trialing_expired:
            period_days = _period_days(sub.billing_period)
            sub.status = Subscription.Status.ACTIVE
            sub.current_period_start = now
            sub.current_period_end = now + timedelta(days=period_days)
            sub.trial_end = None
            sub.save(update_fields=[
                "status", "current_period_start", "current_period_end",
                "trial_end", "updated_at",
            ])
            SubscriptionEvent.objects.create(
                subscription=sub,
                event_type=SubscriptionEvent.EventType.TRIAL_ENDED,
                payload={
                    "trial_ended_at": now.isoformat(),
                    "new_period_end": sub.current_period_end.isoformat(),
                },
            )
            trial_ended += 1

        # 2) ACTIVE + current_period_end < now -> EXPIRED
        active_expired = Subscription.objects.filter(
            status=Subscription.Status.ACTIVE,
            current_period_end__lt=now,
        )
        for sub in active_expired:
            sub.status = Subscription.Status.EXPIRED
            sub.save(update_fields=["status", "updated_at"])
            SubscriptionEvent.objects.create(
                subscription=sub,
                event_type=SubscriptionEvent.EventType.EXPIRED,
                payload={
                    "expired_at": now.isoformat(),
                    "period_end": sub.current_period_end.isoformat(),
                },
            )
            expired_count += 1

        if trial_ended or expired_count:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{trial_ended} deneme bitti (ACTIVE), {expired_count} abonelik süresi doldu."
                )
            )
        else:
            self.stdout.write("İşlenecek abonelik yok.")
