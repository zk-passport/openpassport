/*
 * Copyright 2016 - 2022 Anton Tananaev (anton.tananaev@gmail.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.tananaev.passportreader

import android.os.Bundle
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class ResultActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_result)
        findViewById<TextView>(R.id.output_first_name).text = intent.getStringExtra(KEY_FIRST_NAME)
        findViewById<TextView>(R.id.output_last_name).text = intent.getStringExtra(KEY_LAST_NAME)
        findViewById<TextView>(R.id.output_gender).text = intent.getStringExtra(KEY_GENDER)
        findViewById<TextView>(R.id.output_state).text = intent.getStringExtra(KEY_STATE)
        findViewById<TextView>(R.id.output_nationality).text = intent.getStringExtra(KEY_NATIONALITY)
        findViewById<TextView>(R.id.output_passive_auth).text = intent.getStringExtra(KEY_PASSIVE_AUTH)
        findViewById<TextView>(R.id.output_chip_auth).text = intent.getStringExtra(KEY_CHIP_AUTH)
        if (intent.hasExtra(KEY_PHOTO)) {
            @Suppress("DEPRECATION")
            findViewById<ImageView>(R.id.view_photo).setImageBitmap(intent.getParcelableExtra(KEY_PHOTO))
        }
    }

    companion object {
        const val KEY_FIRST_NAME = "firstName"
        const val KEY_LAST_NAME = "lastName"
        const val KEY_GENDER = "gender"
        const val KEY_STATE = "state"
        const val KEY_NATIONALITY = "nationality"
        const val KEY_PHOTO = "photo"
        const val KEY_PHOTO_BASE64 = "photoBase64"
        const val KEY_PASSIVE_AUTH = "passiveAuth"
        const val KEY_CHIP_AUTH = "chipAuth"
    }
}
