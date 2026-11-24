"""
Synthetic Data Generator for Travel-Folio (TBO.com inventory procurement engine)
Generates 50+ realistic travel inventory items across hotels and flights with
market signals: historical bookings, look-to-book ratios, sold-out tags,
seasonality, external event signals, and volatility.
"""

import json
from typing import List, Dict, Any
import numpy as np
import pandas as pd

DESTINATIONS = [
    {
        "name": "Goa",
        "events": ["Sunburn Music Festival", "Goa Carnival", "Baga Beach Regatta", "International Film Fest"],
        "hotel_prefixes": ["Taj Exotica Resort & Spa", "W Goa Beachfront", "Alila Diwa Luxury Suite", "ITC Grand Goa Luxury", "Leela Goa Beach Villa"],
        "flight_routes": ["BOM-GOI (IndiGo / Air India)", "DEL-GOX (Vistara / Akasa)", "BLR-GOI (Alliance Air)"],
        "default_seasonality": 1.45,
    },
    {
        "name": "Dubai",
        "events": ["Dubai Shopping Festival", "GITEX Global Expo", "Dubai World Cup Racing", "COP Climate Tech Summit"],
        "hotel_prefixes": ["Burj Al Arab Jumeirah", "Atlantis The Palm Deluxe", "JW Marriott Marquis Downtown", "Address Sky View Executive", "Ritz-Carlton DIFC"],
        "flight_routes": ["BOM-DXB (Emirates A380)", "DEL-DXB (Air India / flydubai)", "BLR-DXB (Emirates Boeing 777)"],
        "default_seasonality": 1.35,
    },
    {
        "name": "Bali",
        "events": ["Bali Spirit Festival", "Nusa Dua Cultural Fiesta", "Ubud Writers & Readers Fest", "Nyepi Solar Week"],
        "hotel_prefixes": ["Ayana Resort Jimbaran", "Four Seasons Sayan Ubud", "The Mulia Nusa Dua Ocean", "W Bali Seminyak Retreat", "Padma Resort Legian"],
        "flight_routes": ["DPS-BOM (Batik Air / VietJet)", "DPS-DEL (Singapore Airlines via SIN)", "DPS-BLR (AirAsia X)"],
        "default_seasonality": 1.25,
    },
    {
        "name": "London",
        "events": ["Wimbledon Tennis Championship", "Frieze London Art Fair", "London Fashion Week", "West End Summer Gala"],
        "hotel_prefixes": ["The Savoy Strand London", "The Langham Regent Court", "Shangri-La The Shard", "Claridge's Mayfair Suite", "Hilton London Bankside"],
        "flight_routes": ["LHR-BOM (British Airways Dreamliner)", "LHR-DEL (Virgin Atlantic A350)", "LGW-BLR (Air India Direct)"],
        "default_seasonality": 1.20,
    },
    {
        "name": "Jaipur",
        "events": ["Jaipur Literature Festival", "Teej Heritage Carnival", "Polo Season Trophy", "Diwali Royal Lantern Fest"],
        "hotel_prefixes": ["Rambagh Palace Heritage Wing", "Jai Mahal Palace Luxury", "Fairmont Jaipur Royal Suite", "Samode Palace Heritage", "ITC Rajputana Luxury"],
        "flight_routes": ["DEL-JAI (IndiGo Express)", "BOM-JAI (SpiceJet / Air India)", "BLR-JAI (IndiGo Connect)"],
        "default_seasonality": 1.30,
    },
    {
        "name": "Singapore",
        "events": ["Singapore F1 Grand Prix", "FinTech Festival 2026", "Food & Wine Expo", "Marina Bay Countdown"],
        "hotel_prefixes": ["Marina Bay Sands SkySuite", "Raffles Hotel Colonial Heritage", "Pan Pacific Singapore Bay", "Fullerton Hotel Waterfront", "Capella Singapore Sentosa"],
        "flight_routes": ["SIN-BOM (Singapore Airlines A350)", "SIN-DEL (Air India Star Alliance)", "SIN-BLR (Scoot Direct)"],
        "default_seasonality": 1.40,
    },
    {
        "name": "Paris",
        "events": ["Paris Fashion Week", "Roland Garros French Open", "VivaTech Innovation Summit", "Bastille Day Gala"],
        "hotel_prefixes": ["Le Bristol Paris Palace", "Hôtel de Crillon Champs-Élysées", "Pullman Paris Tour Eiffel", "Shangri-La Paris Seine View", "The Westin Paris Vendôme"],
        "flight_routes": ["CDG-DEL (Air France Boeing 777)", "CDG-BOM (Air France / Air India)", "ORY-BLR (Etihad via AUH)"],
        "default_seasonality": 1.30,
    },
    {
        "name": "Tokyo",
        "events": ["Tokyo Sakura Cherry Blossom Fest", "Tokyo Game Show Tech", "Sumo Grand Tournament", "Autumn Maple Foliage Week"],
        "hotel_prefixes": ["Aman Tokyo Otemachi", "Park Hyatt Shinjuku High Floor", "Grand Hyatt Roppongi Hills", "Keio Plaza Premier Grand", "The Ritz-Carlton Tokyo Midtown"],
        "flight_routes": ["NRT-DEL (All Nippon Airways ANA)", "HND-BOM (Japan Airlines JAL)", "NRT-BLR (Singapore Airlines via SIN)"],
        "default_seasonality": 1.38,
    },
    {
        "name": "Phuket",
        "events": ["Phuket Vegetarian Festival", "King's Cup Regatta", "Songkran Water Extravaganza", "Andaman Seafood Summit"],
        "hotel_prefixes": ["Banyan Tree Phuket Lagoon Villa", "JW Marriott Phuket Resort", "Anantara Layan Ocean Pool", "Trisara Phuket Sea View", "The Nai Harn Beachfront"],
        "flight_routes": ["HKT-BOM (IndiGo Direct)", "HKT-DEL (Air India Express)", "HKT-BLR (Thai Airways via BKK)"],
        "default_seasonality": 1.28,
    },
    {
        "name": "Maldives",
        "events": ["Bioluminescent Beach Season", "Whale Shark Migration Window", "Underwater Dining Gala", "Luxury Yacht Week"],
        "hotel_prefixes": ["Soneva Fushi Overwater Villa", "Conrad Maldives Rangali Island", "Anantara Kihavah Overwater Pool", "Atmosphere Kanifushi Platinum", "OZEN Reserve Bolifushi"],
        "flight_routes": ["MLE-BOM (IndiGo Sea-Hop)", "MLE-DEL (Vistara Direct)", "MLE-BLR (Air India Express)"],
        "default_seasonality": 1.50,
    }
]

PERIODS = [
    ("Peak Holiday", 1.25),
    ("Long Weekend", 1.12),
    ("Shoulder Season", 0.95),
]

def generate_inventory(seed: int = 42) -> List[Dict[str, Any]]:
    np.random.seed(seed)
    items = []
    item_id_counter = 1

    for dest in DESTINATIONS:
        dest_name = dest["name"]
        events = dest["events"]
        hotels = dest["hotel_prefixes"]
        flights = dest["flight_routes"]
        base_season = dest["default_seasonality"]

        # Generate 3-4 hotel blocks for this destination
        for i, hotel_name in enumerate(hotels[:4]):
            period_name, period_mult = PERIODS[i % len(PERIODS)]
            
            # Event signal logic
            has_event = (i % 2 == 0) or (period_name == "Peak Holiday")
            event_name = events[i % len(events)] if has_event else "Standard Travel Period"
            event_signal = round(float(np.random.uniform(1.15, 1.65) if has_event else np.random.uniform(1.0, 1.08)), 2)
            
            # Seasonality index
            seasonality = round(float(base_season * period_mult * np.random.uniform(0.92, 1.08)), 2)
            
            # Sold out indicator: correlated with peak periods and events
            was_sold_out = bool(has_event and (period_name in ["Peak Holiday", "Long Weekend"]) and (np.random.rand() > 0.35))
            
            # Look-to-book ratio: higher when sold out or popular
            if was_sold_out:
                look_to_book = round(float(np.random.uniform(28.0, 58.0)), 1)
                hist_bookings = int(np.random.randint(65, 120))
            else:
                look_to_book = round(float(np.random.uniform(12.0, 32.0)), 1)
                hist_bookings = int(np.random.randint(30, 95))
                
            cost = round(float(np.random.uniform(120, 380)), 2)
            margin_pct = np.random.uniform(0.24, 0.42)
            base_price = round(cost * (1 + margin_pct), 2)
            max_units = int(np.random.randint(25, 80))
            
            # Cancellation rate and demand volatility
            cancellation_rate = round(float(np.random.uniform(0.06, 0.18)), 3)
            # Volatility: higher during shoulder season or unconfirmed event
            if was_sold_out:
                volatility = round(float(np.random.uniform(0.08, 0.17)), 2)
            else:
                volatility = round(float(np.random.uniform(0.18, 0.38)), 2)

            item = {
                "id": f"INV-{item_id_counter:03d}",
                "name": f"{hotel_name} (5-Night Allotment)",
                "destination": dest_name,
                "type": "Hotel Block",
                "travel_period": period_name,
                "event_name": event_name,
                "historical_bookings": hist_bookings,
                "look_to_book_ratio": look_to_book,
                "was_sold_out": was_sold_out,
                "seasonality_index": seasonality,
                "external_event_signal": event_signal,
                "procurement_cost_per_unit": cost,
                "base_selling_price": base_price,
                "max_available_units": max_units,
                "cancellation_rate": cancellation_rate,
                "demand_volatility": volatility,
            }
            items.append(item)
            item_id_counter += 1

        # Generate 2-3 flight blocks for this destination
        for j, flight_name in enumerate(flights[:3]):
            period_name, period_mult = PERIODS[(j + 1) % len(PERIODS)]
            has_event = (j == 0) or (period_name == "Peak Holiday")
            event_name = events[(j + 2) % len(events)] if has_event else "Standard Travel Period"
            event_signal = round(float(np.random.uniform(1.10, 1.55) if has_event else np.random.uniform(1.0, 1.05)), 2)
            seasonality = round(float(base_season * period_mult * np.random.uniform(0.90, 1.05)), 2)
            
            was_sold_out = bool(has_event and (np.random.rand() > 0.4))
            if was_sold_out:
                look_to_book = round(float(np.random.uniform(32.0, 65.0)), 1)
                hist_bookings = int(np.random.randint(80, 140))
                volatility = round(float(np.random.uniform(0.07, 0.16)), 2)
            else:
                look_to_book = round(float(np.random.uniform(14.0, 35.0)), 1)
                hist_bookings = int(np.random.randint(40, 90))
                volatility = round(float(np.random.uniform(0.19, 0.36)), 2)
                
            cost = round(float(np.random.uniform(180, 520)), 2)
            margin_pct = np.random.uniform(0.18, 0.32)
            base_price = round(cost * (1 + margin_pct), 2)
            max_units = int(np.random.randint(30, 90))
            cancellation_rate = round(float(np.random.uniform(0.04, 0.14)), 3)

            item = {
                "id": f"INV-{item_id_counter:03d}",
                "name": f"{flight_name} Seat Allocation",
                "destination": dest_name,
                "type": "Flight Seat Block",
                "travel_period": period_name,
                "event_name": event_name,
                "historical_bookings": hist_bookings,
                "look_to_book_ratio": look_to_book,
                "was_sold_out": was_sold_out,
                "seasonality_index": seasonality,
                "external_event_signal": event_signal,
                "procurement_cost_per_unit": cost,
                "base_selling_price": base_price,
                "max_available_units": max_units,
                "cancellation_rate": cancellation_rate,
                "demand_volatility": volatility,
            }
            items.append(item)
            item_id_counter += 1

    return items

def get_inventory_dataframe(seed: int = 42) -> pd.DataFrame:
    items = generate_inventory(seed=seed)
    return pd.DataFrame(items)

if __name__ == "__main__":
    df = get_inventory_dataframe()
    print(f"Generated {len(df)} travel inventory items across {df['destination'].nunique()} destinations.")
    print("Types:", df["type"].value_counts().to_dict())
    print("Sold out count:", df["was_sold_out"].sum())
    print(df.head(3))
