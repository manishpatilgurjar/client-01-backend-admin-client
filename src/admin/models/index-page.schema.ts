import { Schema, model, Document, Types } from 'mongoose';

export interface PageSectionContent {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  featuredProducts?: Types.ObjectId[];
}

export interface PageSection {
  _id?: string;
  name: string;
  description: string;
  status: 'Active' | 'Draft' | 'Inactive';
  lastModified: Date;
  content: PageSectionContent;
  isActive: boolean;
  order: number;
}

export interface IndexPageMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface IndexPage extends Document {
  pageId: string;
  pageTitle: string;
  sections: PageSection[];
  metadata: IndexPageMetadata;
}

const PageSectionContentSchema = new Schema<PageSectionContent>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  description: { type: String, required: true },
  buttonText: { type: String, required: true },
  buttonLink: { type: String, required: true },
  featuredProducts: { type: [Schema.Types.ObjectId], ref: 'Product', default: [] },
});

const PageSectionSchema = new Schema<PageSection>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Active', 'Draft', 'Inactive'], 
    default: 'Draft' 
  },
  lastModified: { type: Date, default: Date.now },
  content: { type: PageSectionContentSchema, required: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
});

const IndexPageMetadataSchema = new Schema<IndexPageMetadata>({
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  version: { type: String, default: '1.0' },
});

const IndexPageSchema = new Schema<IndexPage>({
  pageId: { type: String, required: true, unique: true, default: 'index-page' },
  pageTitle: { type: String, required: true, default: 'Homepage' },
  sections: [PageSectionSchema],
  metadata: { type: IndexPageMetadataSchema, default: () => ({}) },
});

// Update the metadata.updatedAt field before saving
IndexPageSchema.pre('save', function (next) {
  if (this.metadata) {
    this.metadata.updatedAt = new Date();
  }
  next();
});

// Update lastModified for sections when they are modified
IndexPageSchema.pre('save', function (next) {
  if (this.isModified('sections')) {
    this.sections.forEach(section => {
      section.lastModified = new Date();
    });
  }
  next();
});

export const IndexPageModel = model<IndexPage>('IndexPage', IndexPageSchema, 'index_page'); 