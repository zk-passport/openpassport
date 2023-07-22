package com.tananaev.passportreader

import android.os.Bundle
import android.preference.PreferenceManager
import android.widget.FrameLayout
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds
import com.google.android.play.core.review.ReviewManagerFactory
import com.google.firebase.analytics.FirebaseAnalytics
import com.google.firebase.analytics.ktx.analytics
import com.google.firebase.ktx.Firebase

class GoogleActivity : MainActivity() {
    private lateinit var firebaseAnalytics: FirebaseAnalytics

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        firebaseAnalytics = Firebase.analytics
        MobileAds.initialize(this) {}

        val adView = AdView(this).apply {
            setAdSize(AdSize.BANNER)
            adUnitId = "ca-app-pub-9061647223840223/5869276959"
            loadAd(AdRequest.Builder().build())
        }
        val params = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.WRAP_CONTENT,
        )
        val containerView: FrameLayout = findViewById(R.id.bottom_container)
        containerView.addView(adView, params)
    }

    override fun onResume() {
        super.onResume()
        handleRating()
    }

    @Suppress("DEPRECATION")
    private fun handleRating() {
        val preferences = PreferenceManager.getDefaultSharedPreferences(this)
        if (!preferences.getBoolean("ratingShown", false)) {
            val openTimes = preferences.getInt("openTimes", 0) + 1
            preferences.edit().putInt("openTimes", openTimes).apply()
            if (openTimes >= 5) {
                val reviewManager = ReviewManagerFactory.create(this)
                reviewManager.requestReviewFlow().addOnCompleteListener { infoTask ->
                    if (infoTask.isSuccessful) {
                        val flow = reviewManager.launchReviewFlow(this, infoTask.result)
                        flow.addOnCompleteListener {
                            preferences.edit().putBoolean("ratingShown", true).apply()
                        }
                    }
                }
            }
        }
    }
}
